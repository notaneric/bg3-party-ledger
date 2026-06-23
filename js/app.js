/* ============================================================
   APP — render + interaction. Re-renders from db state on every
   change; commits happen on blur/change (so re-render never eats
   keystrokes). Edit controls appear only on YOUR claimed seat
   (honor-system). Shared story is editable by all. Everything is
   logged for undo via the history drawer.
   ============================================================ */

import { db } from "./db.js";
import { SEATS, CLASSES, RACES, ORIGINS, ABILITIES, COMPANIONS } from "./config.js";
import { mod, actProgress } from "./data.js";
import * as I from "./icons.js";
import * as A from "./anim.js";

const SEAT_VARS = ["var(--seat-0)", "var(--seat-1)", "var(--seat-2)", "var(--seat-3)"];
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// Consistent format for posted notes: trim, collapse whitespace, capitalize first letter.
// Leaves the rest as typed so proper nouns (Zevlor, Withers) keep their case.
const normalizeNote = (s) => {
  s = String(s ?? "").trim().replace(/\s+/g, " ");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
};

const state = {
  mySeat: localStorage.getItem("ledger-my-seat") || "",
  openSlug: null,
  tab: "char",
  drawer: false,
  dealt: false,
};

function seatName(slug) {
  const p = db.players.find((x) => x.slug === slug);
  return p ? (p.display_name || slug) : "Someone";
}
function refreshActor() { db.setActor(state.mySeat ? seatName(state.mySeat) : "Someone"); }
function isMine(slug) { return state.mySeat && slug === state.mySeat; }

/* ============================ RENDER ============================ */
function render() {
  refreshActor();
  const app = $("#app");
  app.innerHTML = `
    ${masthead()}
    ${statusbar()}
    <main class="deck" id="deck">${db.players.map(card).join("")}</main>
    ${storyPanel()}
  `;
  document.body.querySelector("#overlays").innerHTML =
    (state.openSlug ? sheet(state.openSlug) : "") + drawer() + histButton() + syncBadge();

  wire();

  // first paint: deal the deck in once
  if (!state.dealt) {
    state.dealt = true;
    requestAnimationFrame(() => {
      A.dealIn([...document.querySelectorAll("#deck .card")]);
    });
  }
  document.querySelectorAll("#deck .card").forEach(A.attachFoil);
}

/* ---------------- masthead ---------------- */
function masthead() {
  const c = db.story.campaign;
  return `<header class="mast">
    <div class="kicker">Baldur's Gate 3 · Co-op Run</div>
    <h1 contenteditable="true" spellcheck="false" data-edit="campaign.title">${esc(c.title)}</h1>
    <div class="filigree">${I.FILIGREE_BAR}</div>
    <p class="sub" contenteditable="true" spellcheck="false" data-edit="campaign.subtitle">${esc(c.subtitle)}</p>
  </header>`;
}

/* ---------------- status bar ---------------- */
function statusbar() {
  const opts = `<option value="">— spectating —</option>` + SEATS.map((s) => {
    const p = db.players.find((x) => x.slug === s.slug);
    const label = p?.claimed ? (p.display_name + (p.char.name ? ` (${p.char.name})` : "")) : s.default_name + " (unclaimed)";
    return `<option value="${s.slug}" ${state.mySeat === s.slug ? "selected" : ""}>${esc(label)}</option>`;
  }).join("");

  const acts = db.story.acts.map((a) => {
    const active = db.story.current_act === a.n;
    const pct = actProgress(a);
    return `<div class="act ${active ? "active" : ""} ${a.locked ? "sealed" : ""}">
      ${esc(a.name)}<span class="bar"><i style="width:${a.locked ? 0 : pct}%"></i></span>
    </div>`;
  }).join("");

  return `<section class="statusbar">
    <div class="seatpick">
      <span class="lbl">You are</span>
      <select id="seatSelect" aria-label="Choose your seat">${opts}</select>
    </div>
    <div class="actbar">
      <div class="acts">${acts}</div>
    </div>
  </section>`;
}

/* ---------------- tarot card ---------------- */
function card(p, i) {
  const seat = SEAT_VARS[i % 4];
  const roman = SEATS[i].roman;
  if (!p.claimed) {
    return `<button class="card unclaimed" style="--seat:${seat}" data-slug="${p.slug}" aria-label="Claim ${esc(SEATS[i].default_name)}">
      ${frame()}
      <div class="back">
        <div class="seal">${I.TAROT_SEAL}</div>
        <div class="await">Unclaimed</div>
        <div class="claim">Claim this card</div>
        <div class="hint">${esc(SEATS[i].default_name)}</div>
      </div>
    </button>`;
  }
  const ch = p.char;
  const emblem = I.CLASS_ICON[ch.class] || I.SIGIL;
  const lvl = ch.level || 1;
  const recruited = p.companions.length;
  const quests = p.quests.filter((q) => q.status !== "done").length;
  return `<button class="card ${isMine(p.slug) ? "is-yours" : ""}" style="--seat:${seat}" data-slug="${p.slug}" aria-label="Open ${esc(p.display_name)}'s sheet">
    ${frame()}
    <span class="ownerflag">Yours</span>
    <div class="face">
      <div class="roman">${roman}</div>
      <div class="emblem">${emblem}</div>
      <div class="nameplate">
        <div class="pcname">${esc(ch.name || p.display_name)}</div>
        <div class="pcclass">${esc([ch.race, ch.class].filter(Boolean).join(" ") || "No character yet")}${ch.subclass ? " · " + esc(ch.subclass) : ""}</div>
        <div class="pcmeta"><span>LVL <b>${lvl}</b></span><span>·</span><span>${esc(ch.origin || "Tav")}</span></div>
        <div class="pips">
          <div class="pip"><b>${recruited}</b>allies</div>
          <div class="pip"><b>${quests}</b>quests</div>
          <div class="pip"><b>${p.deaths}</b>deaths</div>
        </div>
      </div>
    </div>
  </button>`;
}

function frame() {
  return `<div class="frame"></div>
    <div class="corners">
      <span class="tl">${I.FILIGREE_CORNER}</span><span class="tr">${I.FILIGREE_CORNER}</span>
      <span class="bl">${I.FILIGREE_CORNER}</span><span class="br">${I.FILIGREE_CORNER}</span>
    </div>
    <div class="foil"></div>`;
}

/* ============================ SHEET ============================ */
function sheet(slug) {
  const i = db.players.findIndex((p) => p.slug === slug);
  const p = db.players[i];
  if (!p) return "";
  const mine = isMine(slug);
  const seat = SEAT_VARS[i % 4];
  const emblem = I.CLASS_ICON[p.char.class] || I.SIGIL;

  const tabs = [
    ["char", "Character & Build"],
    ["quests", "Quests & Choices"],
    ["allies", "Companions"],
    ["journal", "Journal · Gear · Deaths"],
  ];

  return `<div class="scrim" id="scrim" style="--seat:${seat}">
    <article class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="${esc(p.display_name)} character sheet">
      <button class="closebtn" data-close aria-label="Close">✕</button>
      <header>
        <div class="crest">${emblem}</div>
        <div class="htext">
          <div class="nm" ${mine ? 'contenteditable="true" spellcheck="false" data-pedit="char.name"' : ""}>${esc(p.char.name || p.display_name)}</div>
          <div class="ln">${esc([p.char.race, p.char.class, p.char.subclass].filter(Boolean).join(" · ") || "No character yet")} · Level ${p.char.level || 1}</div>
        </div>
        ${mine ? `<span class="readonly-tag" style="color:var(--seat);border-color:var(--seat)">Your card</span>`
                : `<span class="readonly-tag">View only</span>`}
      </header>
      <nav class="tabs">
        ${tabs.map(([k, label]) => `<button data-tab="${k}" class="${state.tab === k ? "active" : ""}">${label}</button>`).join("")}
      </nav>
      <div class="${mine ? "editing" : "readonly"}">
        ${panelChar(p, mine)}
        ${panelQuests(p, mine)}
        ${panelAllies(p, mine)}
        ${panelJournal(p, mine)}
      </div>
      ${mine ? "" : `<div class="editbar"><span class="note">Only ${esc(p.display_name)} can edit this card.</span></div>`}
    </article>
  </div>`;
}

function pfield(p, mine, path, label, value, opts) {
  const v = value ?? "";
  let control = "";
  if (mine) {
    if (opts?.options) {
      control = `<select data-pedit="${path}"><option value="">—</option>${opts.options.map((o) =>
        `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    } else if (opts?.type === "number") {
      control = `<input type="number" data-pedit="${path}" value="${esc(v)}" min="${opts.min ?? 1}" max="${opts.max ?? 12}">`;
    } else {
      control = `<input type="text" data-pedit="${path}" value="${esc(v)}" placeholder="${esc(opts?.ph || "")}">`;
    }
  }
  return `<div class="field">
    <label>${esc(label)}</label>
    <div class="val ${v ? "" : "empty"}">${v ? esc(v) : esc(opts?.ph || "Unwritten")}</div>
    ${control}
  </div>`;
}

function panelChar(p, mine) {
  const c = p.char;
  const abil = ABILITIES.map((a) => {
    const sc = c.abilities[a] ?? 10;
    return `<div class="abil">
      <div class="ab">${a}</div>
      <div class="sc">${mine ? `<input type="number" data-pedit="char.abilities.${a}" value="${sc}" min="1" max="30">` : sc}</div>
      <div class="mod">${mod(sc)}</div>
    </div>`;
  }).join("");
  return `<section class="panel ${state.tab === "char" ? "active" : ""}" data-panel="char">
    <h3>Identity</h3>
    <div class="fields">
      ${pfield(p, mine, "char.name", "Character name", c.name, { ph: "Tav" })}
      ${pfield(p, mine, "char.origin", "Origin", c.origin, { options: ORIGINS })}
      ${pfield(p, mine, "char.race", "Race", c.race, { options: RACES })}
      ${pfield(p, mine, "char.background", "Background", c.background, { ph: "e.g. Soldier" })}
    </div>
    <h3>Class & Build</h3>
    <div class="fields">
      ${pfield(p, mine, "char.class", "Class", c.class, { options: CLASSES })}
      ${pfield(p, mine, "char.subclass", "Subclass", c.subclass, { ph: "e.g. Battle Master" })}
      ${pfield(p, mine, "char.level", "Level", c.level, { type: "number", min: 1, max: 12 })}
      ${pfield(p, mine, "char.multiclass", "Multiclass", c.multiclass, { ph: "e.g. 2 Rogue / 3 Ranger" })}
    </div>
    <h3>Ability Scores</h3>
    <div class="abilities">${abil}</div>
    <h3>Feats & Notes</h3>
    <div class="fields"><div class="field" style="grid-column:1/-1">
      <label>Feats</label>
      <div class="val ${c.feats ? "" : "empty"}">${c.feats ? esc(c.feats) : "None yet"}</div>
      ${mine ? `<textarea data-pedit="char.feats" rows="2" placeholder="Great Weapon Master, Ability Improvement…">${esc(c.feats)}</textarea>` : ""}
    </div></div>
  </section>`;
}

function panelQuests(p, mine) {
  const rows = p.quests.length ? p.quests.map((q, idx) => `
    <div class="row status-${q.status}">
      <button class="marker" data-quest-toggle="${idx}" title="Toggle complete">${q.status === "done" ? "✓" : "◇"}</button>
      <div class="body">
        <div class="title">${esc(q.title)}</div>
        ${q.note ? `<div class="desc">${esc(q.note)}</div>` : ""}
      </div>
      ${mine ? `<button class="rm" data-quest-rm="${idx}" title="Remove">✕</button>` : ""}
    </div>`).join("") : `<p class="hist-empty">Nothing logged yet.</p>`;
  return `<section class="panel ${state.tab === "quests" ? "active" : ""}" data-panel="quests">
    <h3>Personal Quests & Choices</h3>
    <p class="actsub" style="color:var(--parch-dim);font-style:italic;margin-bottom:.8rem">Your own side quests and the choices you made.</p>
    <div class="list">${rows}</div>
    ${mine ? `<div class="addrow">
      <input type="text" id="qTitle" placeholder="Quest or choice…">
      <input type="text" id="qNote" placeholder="Detail (optional)">
      <button class="btn" data-quest-add>Add</button>
    </div>` : ""}
  </section>`;
}

function panelAllies(p, mine) {
  const rows = p.companions.length ? p.companions.map((c, idx) => {
    const ap = Math.max(-100, Math.min(100, Number(c.approval) || 0));
    const w = (ap + 100) / 2;
    return `<div class="row">
      <div class="marker">${esc((c.name || "?")[0])}</div>
      <div class="body">
        <div class="title">${esc(c.name)} ${c.romance ? '<span class="tag good">romance</span>' : ""} ${c.inparty ? '<span class="tag">in party</span>' : ""}</div>
        <div class="approval">
          <span>Approval</span>
          <span class="meter"><i style="width:${w}%"></i></span>
          <b style="color:var(--gold-soft)">${ap > 0 ? "+" : ""}${ap}</b>
          ${mine ? `<button class="btn ghost" style="padding:.2rem .5rem" data-ally-ap="${idx}:-5">−</button>
                    <button class="btn ghost" style="padding:.2rem .5rem" data-ally-ap="${idx}:5">+</button>
                    <button class="btn ghost" style="padding:.2rem .5rem" data-ally-romance="${idx}">♥</button>
                    <button class="btn ghost" style="padding:.2rem .5rem" data-ally-party="${idx}">⚔</button>` : ""}
        </div>
      </div>
      ${mine ? `<button class="rm" data-ally-rm="${idx}" title="Remove">✕</button>` : ""}
    </div>`;
  }).join("") : `<p class="hist-empty">No companions yet.</p>`;
  const avail = COMPANIONS.filter((n) => !p.companions.some((c) => c.name === n));
  return `<section class="panel ${state.tab === "allies" ? "active" : ""}" data-panel="allies">
    <h3>Companions & Approval</h3>
    <div class="list">${rows}</div>
    ${mine ? `<div class="addrow">
      <select id="allyName">${avail.map((n) => `<option>${esc(n)}</option>`).join("")}<option>Other…</option></select>
      <button class="btn" data-ally-add>Add</button>
    </div>` : ""}
  </section>`;
}

function panelJournal(p, mine) {
  const entries = p.journal.length ? p.journal.slice().reverse().map((e) => `
    <div class="entry">
      <div class="when">${new Date(e.ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</div>
      <div class="text">${esc(e.text)}</div>
    </div>`).join("") : `<p class="hist-empty">No entries yet.</p>`;
  const gear = p.gear.length ? p.gear.map((g, idx) => `
    <div class="row">
      <div class="marker">${esc((g.name || "?")[0])}</div>
      <div class="body"><div class="title">${esc(g.name)}</div>${g.note ? `<div class="desc">${esc(g.note)}</div>` : ""}</div>
      ${mine ? `<button class="rm" data-gear-rm="${idx}" title="Remove">✕</button>` : ""}
    </div>`).join("") : `<p class="hist-empty">No gear logged yet.</p>`;
  return `<section class="panel ${state.tab === "journal" ? "active" : ""}" data-panel="journal">
    <h3>Tallies</h3>
    <div class="strip">
      <div class="stat-chip danger"><span class="n" data-count="${p.deaths}">${p.deaths}</span><span class="k">Deaths</span></div>
      <div class="stat-chip"><span class="n" data-count="${p.long_rests}">${p.long_rests}</span><span class="k">Long rests</span></div>
      <div class="stat-chip"><span class="n">${p.honour ? "Yes" : "No"}</span><span class="k">Honour mode</span></div>
    </div>
    ${mine ? `<div class="addrow" style="margin-top:1rem">
      <button class="btn ghost" data-bump="deaths:1">+ Death</button>
      <button class="btn ghost" data-bump="deaths:-1">− Death</button>
      <button class="btn ghost" data-bump="long_rests:1">+ Long rest</button>
      <button class="btn ghost" data-toggle-honour>Toggle Honour</button>
    </div>` : ""}

    <h3>Notable Gear</h3>
    <div class="list">${gear}</div>
    ${mine ? `<div class="addrow">
      <input type="text" id="gName" placeholder="Item…">
      <input type="text" id="gNote" placeholder="Note (optional)">
      <button class="btn" data-gear-add>Add</button>
    </div>` : ""}

    <h3>Journal</h3>
    ${mine ? `<div class="addrow" style="flex-direction:column;align-items:stretch">
      <textarea id="jText" rows="3" placeholder="What happened this session…"></textarea>
      <div><button class="btn" data-journal-add>Add entry</button></div>
    </div>` : ""}
    <div class="list" style="margin-top:.8rem">${entries}</div>
  </section>`;
}

/* ============================ SHARED STORY ============================ */
function storyPanel() {
  const st = db.story;
  const cols = st.acts.map((a) => {
    if (a.locked) {
      const prev = st.acts.find((x) => x.n === a.n - 1);
      const canUnlock = prev && actProgress(prev) >= 50;
      return `<div class="actcol sealed">
        <h4>${esc(a.name)}</h4>
        <div class="actsub">${esc(a.sub)}</div>
        <div class="sealmark">${I.LOCK}</div>
        <div class="sealtxt">Locked until you get here.</div>
        <div class="unlock"><button class="btn ${canUnlock ? "" : "ghost"}" data-unlock="${a.n}">Unlock ${esc(a.name)}</button></div>
      </div>`;
    }
    const pct = actProgress(a);
    const beats = a.beats.map((b, idx) => `
      <div class="beat ${b.done ? "done" : ""}">
        <button class="box" data-beat="${a.n}:${idx}" aria-label="Toggle beat">${b.done ? "✓" : ""}</button>
        <div class="txt" contenteditable="true" spellcheck="false" data-beat-edit="${a.n}:${idx}" title="Click to edit">${esc(b.txt)}</div>
        <button class="rm" data-beat-rm="${a.n}:${idx}" title="Delete">✕</button>
      </div>`).join("");
    return `<div class="actcol ${st.current_act === a.n ? "" : ""}">
      <h4>${esc(a.name)} <span class="pct">${pct}%</span></h4>
      <div class="actsub">${esc(a.sub)}</div>
      ${beats || '<div class="actsub">No beats yet.</div>'}
      <div class="addrow" style="margin-top:.6rem">
        <input type="text" data-beat-input="${a.n}" placeholder="Add a beat…">
        <button class="btn ghost" data-beat-add="${a.n}">Add</button>
      </div>
    </div>`;
  }).join("");

  return `<section class="story">
    <div class="sectitle"><span class="ln"></span><h2>The Shared Story</h2><span class="ln"></span></div>
    <p class="where">The party is at
      <b contenteditable="true" spellcheck="false" data-edit="location">${esc(st.location)}</b>
    </p>
    <div class="acts-grid">${cols}</div>
  </section>`;
}

/* ============================ HISTORY DRAWER ============================ */
function histButton() {
  const live = db.history.filter((h) => !h.reverted).length;
  return `<button class="histbtn" id="histBtn">${I.HISTORY}<span>History</span>${live ? '<span class="dot"></span>' : ""}</button>`;
}

function drawer() {
  const items = db.history.length ? db.history.map((h) => {
    const ago = timeAgo(h.created_at);
    const diff = (h.old_display || h.new_display)
      ? `<div class="diff">${h.old_display ? `<span class="old">${esc(trunc(h.old_display))}</span> → ` : ""}<span class="new">${esc(trunc(h.new_display) || "—")}</span></div>`
      : "";
    return `<div class="histitem ${h.reverted ? "reverted" : ""}">
      <div class="top"><span class="who">${esc(h.edited_by)}</span><span class="ago">${ago}</span></div>
      <div class="what"><b>${esc(h.field_label)}</b> on ${esc(h.target_label)}</div>
      ${diff}
      ${h.reverted ? `<div class="ago" style="margin-top:.4rem">Undone by ${esc(h.reverted_by || "someone")}</div>`
                   : `<button class="undo" data-undo="${h.id}">Undo this change</button>`}
    </div>`;
  }).join("") : `<p class="hist-empty">No changes yet. Every edit shows up here, and you can undo any of them.</p>`;
  return `<aside class="drawer ${state.drawer ? "open" : ""}" id="drawer">
    <header><h3>Change history</h3><button class="x" data-drawer-close aria-label="Close">✕</button></header>
    <div class="hist-list">${items}</div>
  </aside>`;
}

function syncBadge() {
  const live = db.mode === "live";
  return `<div class="syncbadge ${live ? "live" : "local"}">
    <span class="led"></span>${live ? "Live · synced" : "Local · this device"}
  </div>`;
}

/* ============================ WIRING ============================ */
function wire() {
  // seat selector
  const sel = $("#seatSelect");
  if (sel) sel.addEventListener("change", (e) => {
    state.mySeat = e.target.value;
    localStorage.setItem("ledger-my-seat", state.mySeat);
    render();
  });

  // campaign / story contenteditable + location
  document.querySelectorAll("[data-edit]").forEach((el) => {
    el.addEventListener("blur", () => {
      const path = el.dataset.edit;
      const val = el.textContent.trim();
      if (path === "campaign.title") { if (val !== db.story.campaign.title) commitStoryPath("campaign.title", val, "renamed the campaign"); }
      else if (path === "campaign.subtitle") { if (val !== db.story.campaign.subtitle) commitStoryPath("campaign.subtitle", val, "changed the subtitle"); }
      else if (path === "location") { if (val !== db.story.location) commitStoryPath("location", val, "moved the party"); }
    });
  });

  // cards open / claim
  document.querySelectorAll("#deck .card").forEach((el) => {
    el.addEventListener("click", () => {
      const slug = el.dataset.slug;
      const p = db.players.find((x) => x.slug === slug);
      if (!p.claimed) return onClaim(slug);
      openSheetFor(slug);
    });
  });

  // sheet wiring
  if (state.openSlug) wireSheet();

  // story wiring
  wireStory();

  // history button + drawer
  const hb = $("#histBtn"); if (hb) hb.addEventListener("click", () => { state.drawer = true; renderOverlays(); });
  const dc = $("[data-drawer-close]"); if (dc) dc.addEventListener("click", () => { state.drawer = false; renderOverlays(); });
  document.querySelectorAll("[data-undo]").forEach((b) =>
    b.addEventListener("click", async () => {
      const e = await db.undo(b.dataset.undo);
      if (e) toast(`Undone — ${esc(e.field_label)} reverted.`);
    }));
}

function renderOverlays() {
  document.body.querySelector("#overlays").innerHTML =
    (state.openSlug ? sheet(state.openSlug) : "") + drawer() + histButton() + syncBadge();
  // re-wire just overlays
  if (state.openSlug) wireSheet();
  const hb = $("#histBtn"); if (hb) hb.addEventListener("click", () => { state.drawer = true; renderOverlays(); });
  const dc = $("[data-drawer-close]"); if (dc) dc.addEventListener("click", () => { state.drawer = false; renderOverlays(); });
  document.querySelectorAll("[data-undo]").forEach((b) =>
    b.addEventListener("click", async () => { const e = await db.undo(b.dataset.undo); if (e) toast(`Undone. ${esc(e.field_label)} reverted.`); }));
}

function openSheetFor(slug) {
  state.openSlug = slug; state.tab = "char";
  renderOverlays();
  requestAnimationFrame(() => A.openSheet($("#scrim"), $("#sheet")));
}
function closeSheet() { state.openSlug = null; renderOverlays(); }

function onClaim(slug) {
  const name = prompt("Your name:", "");
  if (name === null) return;
  if (!state.mySeat) { state.mySeat = slug; localStorage.setItem("ledger-my-seat", slug); }
  if (name) db.setActor(name);
  db.claim(slug, name || undefined);
  toast(`<b>${esc(name || "Someone")}</b> claimed their card.`);
}

function wireSheet() {
  const scrim = $("#scrim");
  if (!scrim) return;
  scrim.addEventListener("click", (e) => { if (e.target === scrim) closeSheet(); });
  $("[data-close]")?.addEventListener("click", closeSheet);

  document.querySelectorAll(".tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab;
      document.querySelectorAll(".tabs button").forEach((x) => x.classList.toggle("active", x === b));
      document.querySelectorAll(".panel").forEach((pp) => pp.classList.toggle("active", pp.dataset.panel === state.tab));
    }));

  const slug = state.openSlug;

  // editable fields (inputs/selects/textareas/contenteditable name)
  document.querySelectorAll("[data-pedit]").forEach((el) => {
    const ev = el.tagName === "SELECT" ? "change" : (el.isContentEditable ? "blur" : "change");
    el.addEventListener(ev, () => {
      const path = el.dataset.pedit;
      const val = el.isContentEditable ? el.textContent.trim() : el.value;
      commitPlayerPath(slug, path, coerce(path, val));
    });
  });

  // quests
  $("[data-quest-add]")?.addEventListener("click", () => {
    const t = $("#qTitle")?.value.trim(); if (!t) return;
    const note = $("#qNote")?.value.trim();
    db.commitPlayer(slug, (d) => d.quests.push({ title: t, note, status: "active" }),
      { label: "logged a quest", new: t });
  });
  document.querySelectorAll("[data-quest-toggle]").forEach((b) => b.addEventListener("click", () => {
    const idx = +b.dataset.questToggle;
    db.commitPlayer(slug, (d) => { const q = d.quests[idx]; q.status = q.status === "done" ? "active" : "done"; },
      { label: "updated a quest" });
  }));
  document.querySelectorAll("[data-quest-rm]").forEach((b) => b.addEventListener("click", () => {
    const idx = +b.dataset.questRm;
    const t = db.players.find((p) => p.slug === slug).quests[idx]?.title;
    db.commitPlayer(slug, (d) => d.quests.splice(idx, 1), { label: "removed a quest", old: t });
  }));

  // companions
  $("[data-ally-add]")?.addEventListener("click", () => {
    let name = $("#allyName")?.value;
    if (name === "Other…") { name = prompt("Companion name:", "")?.trim(); if (!name) return; }
    db.commitPlayer(slug, (d) => d.companions.push({ name, approval: 0, romance: false, inparty: true }),
      { label: "recruited a companion", new: name });
  });
  document.querySelectorAll("[data-ally-ap]").forEach((b) => b.addEventListener("click", () => {
    const [idx, delta] = b.dataset.allyAp.split(":").map(Number);
    db.commitPlayer(slug, (d) => { d.companions[idx].approval = Math.max(-100, Math.min(100, (Number(d.companions[idx].approval) || 0) + delta)); },
      { label: "changed approval" });
  }));
  document.querySelectorAll("[data-ally-romance]").forEach((b) => b.addEventListener("click", () => {
    const idx = +b.dataset.allyRomance;
    db.commitPlayer(slug, (d) => { d.companions[idx].romance = !d.companions[idx].romance; }, { label: "toggled romance" });
  }));
  document.querySelectorAll("[data-ally-party]").forEach((b) => b.addEventListener("click", () => {
    const idx = +b.dataset.allyParty;
    db.commitPlayer(slug, (d) => { d.companions[idx].inparty = !d.companions[idx].inparty; }, { label: "changed party" });
  }));
  document.querySelectorAll("[data-ally-rm]").forEach((b) => b.addEventListener("click", () => {
    const idx = +b.dataset.allyRm;
    const nm = db.players.find((p) => p.slug === slug).companions[idx]?.name;
    db.commitPlayer(slug, (d) => d.companions.splice(idx, 1), { label: "dismissed a companion", old: nm });
  }));

  // tallies
  document.querySelectorAll("[data-bump]").forEach((b) => b.addEventListener("click", () => {
    const [field, delta] = b.dataset.bump.split(":"); const dn = Number(delta);
    db.commitPlayer(slug, (d) => { d[field] = Math.max(0, (Number(d[field]) || 0) + dn); },
      { label: `${dn > 0 ? "+" : "−"} ${field.replace("_", " ")}` });
  }));
  $("[data-toggle-honour]")?.addEventListener("click", () => {
    db.commitPlayer(slug, (d) => { d.honour = !d.honour; }, { label: "toggled honour mode" });
  });

  // gear
  $("[data-gear-add]")?.addEventListener("click", () => {
    const n = $("#gName")?.value.trim(); if (!n) return;
    const note = $("#gNote")?.value.trim();
    db.commitPlayer(slug, (d) => d.gear.push({ name: n, note }), { label: "stowed gear", new: n });
  });
  document.querySelectorAll("[data-gear-rm]").forEach((b) => b.addEventListener("click", () => {
    const idx = +b.dataset.gearRm;
    const nm = db.players.find((p) => p.slug === slug).gear[idx]?.name;
    db.commitPlayer(slug, (d) => d.gear.splice(idx, 1), { label: "dropped gear", old: nm });
  }));

  // journal
  $("[data-journal-add]")?.addEventListener("click", () => {
    const t = $("#jText")?.value.trim(); if (!t) return;
    db.commitPlayer(slug, (d) => d.journal.push({ ts: Date.now(), text: t }), { label: "wrote a journal entry" });
  });

  // count-up the death/rest tallies
  requestAnimationFrame(() => {
    document.querySelectorAll("[data-count]").forEach((el) => A.countUp(el, el.dataset.count));
  });
}

function wireStory() {
  // beats
  document.querySelectorAll("[data-beat]").forEach((b) => b.addEventListener("click", () => {
    const [an, idx] = b.dataset.beat.split(":").map(Number);
    db.commitStory((d) => { const a = d.acts.find((x) => x.n === an); a.beats[idx].done = !a.beats[idx].done; },
      { label: "marked a story beat" });
  }));
  document.querySelectorAll("[data-beat-add]").forEach((b) => b.addEventListener("click", () => {
    const an = +b.dataset.beatAdd;
    const input = document.querySelector(`[data-beat-input="${an}"]`);
    const txt = normalizeNote(input?.value); if (!txt) return;
    db.commitStory((d) => { d.acts.find((x) => x.n === an).beats.push({ txt, done: false }); },
      { label: "added a story beat", new: txt });
  }));
  // Enter in the add-beat field posts it
  document.querySelectorAll("[data-beat-input]").forEach((inp) => inp.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); document.querySelector(`[data-beat-add="${inp.dataset.beatInput}"]`)?.click(); }
  }));
  // edit a beat inline (normalize on commit); Enter or blur saves, empty reverts
  document.querySelectorAll("[data-beat-edit]").forEach((el) => {
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
    el.addEventListener("blur", () => {
      const [an, idx] = el.dataset.beatEdit.split(":").map(Number);
      const cur = db.story.acts.find((x) => x.n === an)?.beats[idx]?.txt ?? "";
      const val = normalizeNote(el.textContent);
      if (!val || val === cur) { el.textContent = cur; return; }
      db.commitStory((d) => { d.acts.find((x) => x.n === an).beats[idx].txt = val; },
        { label: "edited a story beat", old: cur, new: val });
    });
  });
  document.querySelectorAll("[data-beat-rm]").forEach((b) => b.addEventListener("click", () => {
    const [an, idx] = b.dataset.beatRm.split(":").map(Number);
    const cur = db.story.acts.find((x) => x.n === an)?.beats[idx]?.txt;
    db.commitStory((d) => { d.acts.find((x) => x.n === an).beats.splice(idx, 1); },
      { label: "removed a story beat", old: cur });
  }));
  document.querySelectorAll("[data-unlock]").forEach((b) => b.addEventListener("click", () => {
    const an = +b.dataset.unlock;
    db.commitStory((d) => { const a = d.acts.find((x) => x.n === an); a.locked = false; d.current_act = an; },
      { label: `unsealed Act ${an}` });
    toast(`<b>Act ${an}</b> unlocked.`);
  }));
}

/* ---------------- commit helpers ---------------- */
function commitPlayerPath(slug, path, val) {
  const before = getPath(db.players.find((p) => p.slug === slug), path);
  if (String(before) === String(val)) return;
  db.commitPlayer(slug, (d) => setPath(d, path, val),
    { label: `set ${humanField(path)}`, old: before, new: val });
}
function commitStoryPath(path, val, label) {
  const before = getPath(db.story, path);
  db.commitStory((d) => setPath(d, path, val), { label, old: before, new: val });
}

function coerce(path, val) {
  if (path === "char.level" || path.startsWith("char.abilities.")) return Math.max(0, Number(val) || 0);
  return val;
}
function humanField(path) {
  const map = { "char.name": "name", "char.race": "race", "char.class": "class", "char.subclass": "subclass",
    "char.level": "level", "char.origin": "origin", "char.background": "background", "char.multiclass": "multiclass",
    "char.feats": "feats" };
  if (map[path]) return map[path];
  if (path.startsWith("char.abilities.")) return path.split(".").pop();
  return path.split(".").pop();
}
function getPath(o, path) { return path.split(".").reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, path, v) {
  const ks = path.split("."); const last = ks.pop();
  const t = ks.reduce((a, k) => (a[k] ??= {}), o); t[last] = v;
}

/* ---------------- toast ---------------- */
function toast(html) {
  let wrap = $(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html;
  wrap.appendChild(t);
  if (window.gsap) window.gsap.fromTo(t, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
  setTimeout(() => {
    if (window.gsap) window.gsap.to(t, { y: -10, opacity: 0, duration: 0.3, onComplete: () => t.remove() });
    else t.remove();
  }, 2600);
}

function trunc(s, n = 40) { s = String(s ?? ""); return s.length > n ? s.slice(0, n) + "…" : s; }
function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

/* ============================ BOOT ============================ */
async function boot() {
  await db.init();
  db.onChange(render);
  render();
  // keyboard: Esc closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (state.openSlug) closeSheet(); else if (state.drawer) { state.drawer = false; renderOverlays(); } }
  });
}
boot();
