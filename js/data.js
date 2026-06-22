/* ============================================================
   DATA MODEL — default shapes + seeded shared story.
   Builds are unknown at start, so player records begin empty
   and unclaimed. Story spine is spoiler-safe: only the
   unavoidable opening beats are seeded; Acts II & III stay
   sealed until the party unlocks them.
   ============================================================ */

import { CAMPAIGN_DEFAULT } from "./config.js";

export function emptyPlayer(seat) {
  return {
    slug: seat.slug,
    claimed: false,
    display_name: seat.default_name,
    char: {
      name: "",
      origin: "Custom (Tav)",
      race: "",
      class: "",
      subclass: "",
      multiclass: "",
      level: 1,
      background: "",
      abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
      feats: "",
    },
    companions: [],   // { name, approval(-100..100), romance:bool, inparty:bool }
    quests: [],       // { title, note, status:'active'|'done' }  (personal side quests + choices)
    journal: [],      // { ts, text }
    gear: [],         // { name, note, slot }
    deaths: 0,
    long_rests: 0,
    honour: false,    // honour mode flag
    updated_at: 0,
    updated_by: "",
  };
}

// ---- Shared story spine (spoiler-safe) ----
// Act I seeds the unavoidable opening you discover in the first hour.
// Acts II/III start sealed (locked:true) — unlock in-app when you arrive,
// then add your own beats. We deliberately don't pre-spoil late content.
export function defaultStory() {
  return {
    id: "party",
    campaign: { ...CAMPAIGN_DEFAULT },
    location: "Aboard the nautiloid",
    current_act: 1,
    acts: [
      {
        n: 1, name: "Act I", sub: "The Tadpole",
        locked: false,
        beats: [
          { txt: "Escape the nautiloid", done: false },
          { txt: "Wake on the beach, gather survivors", done: false },
          { txt: "Find a way to remove the tadpole", done: false },
          { txt: "Decide the fate of the Emerald Grove", done: false },
        ],
      },
      {
        n: 2, name: "Act II", sub: "The Shadow-Cursed Lands",
        locked: true,
        beats: [],
      },
      {
        n: 3, name: "Act III", sub: "Baldur's Gate",
        locked: true,
        beats: [],
      },
    ],
    updated_at: 0,
    updated_by: "",
  };
}

// Ability modifier, D&D 5e.
export function mod(score) {
  const m = Math.floor((Number(score) - 10) / 2);
  return (m >= 0 ? "+" : "") + m;
}

export function actProgress(act) {
  if (act.locked || !act.beats.length) return 0;
  const done = act.beats.filter(b => b.done).length;
  return Math.round((done / act.beats.length) * 100);
}
