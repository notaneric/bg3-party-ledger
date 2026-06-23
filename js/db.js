/* ============================================================
   DB — unified data layer with two adapters:
     • local    : localStorage, single browser, instant (demo/offline)
     • live      : Supabase (Postgres + Realtime), cross-device sync
   Undo: every commit snapshots the whole target record (before/after)
   into an append-only edit_log, plus a human-readable diff. Reverting
   restores the "before" snapshot. Honor-system by design — no hard
   server lock; the log is how accidental edits get undone.
   ============================================================ */

import { SUPABASE, SEATS } from "./config.js";
import { emptyPlayer, defaultStory } from "./data.js";

const LS_KEY = "party-ledger-v1";
const clone = (o) => JSON.parse(JSON.stringify(o));
const now = () => Date.now();
const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 7);

function configured() {
  return SUPABASE.url && SUPABASE.url.startsWith("http") &&
         SUPABASE.anonKey && !SUPABASE.anonKey.startsWith("YOUR_");
}

class DB {
  constructor() {
    this.mode = "local";
    this.players = SEATS.map(emptyPlayer);
    this.story = defaultStory();
    this.history = [];
    this.actor = "Someone";          // display name of whoever is acting
    this._listeners = new Set();
    this._sb = null;
  }

  onChange(cb) { this._listeners.add(cb); return () => this._listeners.delete(cb); }
  _emit() { this._listeners.forEach((cb) => cb()); }
  setActor(name) { this.actor = name || "Someone"; }

  async init() {
    if (configured()) {
      try { await this._initLive(); this.mode = "live"; return this.mode; }
      catch (e) { console.warn("[ledger] live init failed, falling back to local:", e); }
    }
    this._initLocal();
    this.mode = "local";
    return this.mode;
  }

  /* ---------------- LOCAL ---------------- */
  _initLocal() {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.players) this.players = SEATS.map((seat) =>
          s.players.find((p) => p.slug === seat.slug) || emptyPlayer(seat));
        if (s.story) this.story = { ...defaultStory(), ...s.story };
        if (s.history) this.history = s.history;
      } catch { /* keep defaults */ }
    }
  }
  _saveLocal() {
    localStorage.setItem(LS_KEY, JSON.stringify({
      players: this.players, story: this.story, history: this.history,
    }));
  }

  /* ---------------- LIVE (Supabase) ---------------- */
  async _initLive() {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    this._sb = createClient(SUPABASE.url, SUPABASE.anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    });

    // load players
    const { data: pRows, error: pErr } = await this._sb.from("players").select("*");
    if (pErr) throw pErr;
    const byslug = Object.fromEntries((pRows || []).map((r) => [r.slug, r]));
    this.players = SEATS.map((seat) => byslug[seat.slug]?.data
      ? { ...emptyPlayer(seat), ...byslug[seat.slug].data, slug: seat.slug }
      : emptyPlayer(seat));
    // seed any missing player rows
    for (const seat of SEATS) {
      if (!byslug[seat.slug]) await this._sb.from("players").insert({ slug: seat.slug, data: emptyPlayer(seat) });
    }

    // load story
    const { data: sRow } = await this._sb.from("story").select("*").eq("id", "party").maybeSingle();
    if (sRow?.data) this.story = { ...defaultStory(), ...sRow.data };
    else await this._sb.from("story").insert({ id: "party", data: this.story });

    // load history (recent)
    const { data: hRows } = await this._sb.from("edit_log").select("*").order("created_at", { ascending: false }).limit(80);
    this.history = (hRows || []).map((r) => r.entry);

    // realtime
    this._sb.channel("ledger")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, (p) => {
        const row = p.new; if (!row?.data) return;
        const i = this.players.findIndex((x) => x.slug === row.slug);
        if (i >= 0) this.players[i] = { ...emptyPlayer(SEATS[i]), ...row.data, slug: row.slug };
        this._emit();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "story" }, (p) => {
        if (p.new?.data) { this.story = { ...defaultStory(), ...p.new.data }; this._emit(); }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "edit_log" }, (p) => {
        const e = p.new?.entry; if (!e) return;
        const i = this.history.findIndex((h) => h.id === e.id);
        if (i >= 0) this.history[i] = e; else this.history.unshift(e);
        this._emit();
      })
      .subscribe();
  }

  async _persistPlayer(p) {
    if (this.mode === "live") await this._sb.from("players").update({ data: p }).eq("slug", p.slug);
    else this._saveLocal();
  }
  async _persistStory() {
    if (this.mode === "live") await this._sb.from("story").update({ data: this.story }).eq("id", "party");
    else this._saveLocal();
  }
  async _appendLog(entry) {
    this.history.unshift(entry);
    if (this.history.length > 120) this.history.length = 120;
    if (this.mode === "live") await this._sb.from("edit_log").insert({ id: entry.id, entry, created_at: new Date(entry.created_at).toISOString() });
    else this._saveLocal();
  }
  async _updateLog(entry) {
    if (this.mode === "live") await this._sb.from("edit_log").update({ entry }).eq("id", entry.id);
    else this._saveLocal();
  }

  /* ---------------- COMMITS ---------------- */
  // mutator(draftPlayer) mutates in place. meta: {label, old, new}
  async commitPlayer(slug, mutator, meta = {}) {
    const i = this.players.findIndex((p) => p.slug === slug);
    if (i < 0) return;
    const before = clone(this.players[i]);
    const draft = clone(before);
    mutator(draft);
    draft.updated_at = now();
    draft.updated_by = this.actor;
    this.players[i] = draft;

    await this._appendLog({
      id: uid(), target_type: "player", target_id: slug,
      target_label: draft.display_name || before.display_name,
      field_label: meta.label || "edited the page",
      old_display: fmt(meta.old), new_display: fmt(meta.new),
      before_json: before, after_json: draft,
      edited_by: this.actor, created_at: now(), reverted: false,
    });
    await this._persistPlayer(draft);
    this._emit();
  }

  async commitStory(mutator, meta = {}) {
    const before = clone(this.story);
    const draft = clone(before);
    mutator(draft);
    draft.updated_at = now();
    draft.updated_by = this.actor;
    this.story = draft;

    await this._appendLog({
      id: uid(), target_type: "story", target_id: "party",
      target_label: "Shared Story",
      field_label: meta.label || "edited the story",
      old_display: fmt(meta.old), new_display: fmt(meta.new),
      before_json: before, after_json: draft,
      edited_by: this.actor, created_at: now(), reverted: false,
    });
    await this._persistStory();
    this._emit();
  }

  async claim(slug, name) {
    await this.commitPlayer(slug, (d) => {
      d.claimed = true;
      if (name) d.display_name = name;
    }, { label: "claimed this card", new: name });
  }

  /* ---------------- UNDO ---------------- */
  async undo(logId) {
    const entry = this.history.find((h) => h.id === logId);
    if (!entry || entry.reverted) return;

    if (entry.target_type === "player") {
      const i = this.players.findIndex((p) => p.slug === entry.target_id);
      if (i >= 0) {
        const restored = clone(entry.before_json);
        restored.updated_at = now(); restored.updated_by = this.actor;
        this.players[i] = restored;
        await this._persistPlayer(restored);
      }
    } else {
      const restored = clone(entry.before_json);
      restored.updated_at = now(); restored.updated_by = this.actor;
      this.story = restored;
      await this._persistStory();
    }
    entry.reverted = true;
    entry.reverted_by = this.actor;
    await this._updateLog(entry);
    this._emit();
    return entry;
  }
}

function fmt(v) {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export const db = new DB();
