/* ============================================================
   CONFIG — fill in Supabase to go live across devices.
   Leave the placeholders and the app runs locally (this browser
   only) so you can build characters and demo immediately.
   See README.md for the 3-minute Supabase setup.
   ============================================================ */

export const SUPABASE = {
  // Paste from Supabase > Project Settings > API
  url:     "https://gkcbvrbklyfyvpfoggsr.supabase.co",        // e.g. https://abcd1234.supabase.co
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrY2J2cmJrbHlmeXZwZm9nZ3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzYxMTcsImV4cCI6MjA5Nzc1MjExN30.ESYi2NUyw8AQN9kfXb9yhOu_3dDYmIPbllnU7XQzvDw",   // the public "anon" key (safe in client)
};

// One row per seat. slug must stay stable; rename display_name freely in the UI.
// Seat order maps to heraldry accent (0 crimson, 1 teal, 2 violet, 3 moss).
export const SEATS = [
  { slug: "seat-1", default_name: "Seat I",  roman: "I"   },
  { slug: "seat-2", default_name: "Seat II", roman: "II"  },
  { slug: "seat-3", default_name: "Seat III", roman: "III" },
  { slug: "seat-4", default_name: "Seat IV", roman: "IV"  },
];

// Campaign meta (editable in-app; persisted with the story row).
export const CAMPAIGN_DEFAULT = {
  title: "Our Baldur's Gate",
  subtitle: "Four players, one campaign.",
};

export const CLASSES = [
  "Barbarian","Bard","Cleric","Druid","Fighter","Monk",
  "Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard",
];

export const RACES = [
  "Human","Elf","Half-Elf","Drow","Githyanki","Tiefling","Dwarf",
  "Halfling","Gnome","Half-Orc","Dragonborn","Half-Drow",
];

export const ORIGINS = [
  "Custom (Tav)","Astarion","Gale","Lae'zel","Shadowheart",
  "Wyll","Karlach","The Dark Urge",
];

export const ABILITIES = ["STR","DEX","CON","INT","WIS","CHA"];

// BG3 recruitable companions (Act 1 availability) for approval tracking.
export const COMPANIONS = [
  "Astarion","Gale","Lae'zel","Shadowheart","Wyll","Karlach",
  "Halsin","Minthara","Jaheira","Minsc","Withers",
];
