/* ============================================================
   ICONS — authored SVG imagery (no copyrighted BG3 art).
   Class emblems are rune-style stroke glyphs; plus filigree,
   tarot seal, lock, and history marks. All inherit currentColor.
   ============================================================ */

const s = (inner, vb = "0 0 24 24") =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const CLASS_ICON = {
  Barbarian: s(`<path d="M5 19 19 5"/><path d="M14 5h5v5"/><path d="M16 8l-4 4"/><path d="M5 19l3-1 1-3"/>`),
  Bard:      s(`<path d="M9 18a2 2 0 1 1-3-1.7"/><path d="M9 16V6l8-2v9"/><path d="M17 15a2 2 0 1 1-3-1.7"/><path d="M9 9l8-2"/>`),
  Cleric:    s(`<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M18 6l-2 2M6 18l2-2M18 18l-2-2"/>`),
  Druid:     s(`<path d="M12 21c0-4 0-7 0-9"/><path d="M12 12c-4 0-6-2-6-5 3 0 6 1 6 5z"/><path d="M12 9c0-3 2-5 5-5 0 3-2 5-5 5z"/>`),
  Fighter:   s(`<path d="M14.5 3.5 8 10l-1.5 4.5L11 13l6.5-6.5z"/><path d="M6.5 14.5 4 17l3 3 2.5-2.5"/><path d="M9 17l-2 2"/>`),
  Monk:      s(`<path d="M7 11V7a1.6 1.6 0 0 1 3.2 0v3"/><path d="M10.2 10V6.2a1.6 1.6 0 0 1 3.2 0V10"/><path d="M13.4 10.4V7.5a1.5 1.5 0 0 1 3 0V13a5 5 0 0 1-5 5h-1a4.5 4.5 0 0 1-4.5-4.5V11a1.5 1.5 0 0 1 3 0"/>`),
  Paladin:   s(`<path d="M12 3 5 5.5V11c0 5 3.5 8 7 10 3.5-2 7-5 7-10V5.5z"/><path d="M12 8v6M9.5 11h5"/>`),
  Ranger:    s(`<path d="M4 20 20 4"/><path d="M5 9a8 8 0 0 1 10 10"/><path d="M14 4h6v6"/><path d="M4 20l3-1"/>`),
  Rogue:     s(`<path d="M14 4 8.5 9.5"/><path d="M7 11l-3 3 2 2 3-3z"/><path d="M9 9l5.5 5.5"/><path d="M13 13l4 4-1 3-3-1-4-4"/>`),
  Sorcerer:  s(`<path d="M12 3c1.5 3-1.5 4 0 7 1 2 3 2 3 5a3 3 0 0 1-6 0c0-2 1-2 1-4-2 1-3 3-3 5a5 5 0 0 0 10 0c0-5-5-6-5-13z"/>`),
  Warlock:   s(`<path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5z"/><circle cx="12" cy="12" r="2.4"/>`),
  Wizard:    s(`<path d="M5 5h8a3 3 0 0 1 3 3v11"/><path d="M5 5v11a3 3 0 0 0 3 3h8"/><path d="M8 9h5M8 12h5"/>`),
};

// generic sigil for unset class
export const SIGIL = s(`<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/>`);

// corner filigree (drawn for top-left; CSS mirrors the rest)
export const FILIGREE_CORNER = s(`<path d="M3 3v8M3 3h8" stroke-width="1.6"/><path d="M3 7c4 0 6-2 6-4"/><path d="M7 3c0 4-2 6-4 6"/><circle cx="10.5" cy="10.5" r="1"/>`, "0 0 24 24");

// horizontal filigree divider for masthead
export const FILIGREE_BAR = `<svg viewBox="0 0 280 22" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true">
  <path d="M0 11h96"/><path d="M184 11h96"/>
  <path d="M96 11c8 0 10-6 16-6s8 6 16 6"/>
  <path d="M184 11c-8 0-10 6-16 6s-8-6-16-6"/>
  <path d="M132 5c0 0 4 2 8 6 4-4 8-6 8-6"/>
  <circle cx="140" cy="11" r="2.4" fill="currentColor" stroke="none"/>
  <path d="M132 17c0 0 4-2 8-6 4 4 8 6 8 6"/>
</svg>`;

// tarot-back seal (face-down card)
export const TAROT_SEAL = `<svg viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="48" cy="48" r="34"/><circle cx="48" cy="48" r="27"/>
  <path d="M48 14v68M14 48h68M24 24l48 48M72 24 24 72"/>
  <circle cx="48" cy="48" r="9"/>
  <path d="M48 39v18M39 48h18" stroke-width="1.6"/>
  <circle cx="48" cy="14" r="2" fill="currentColor" stroke="none"/>
  <circle cx="48" cy="82" r="2" fill="currentColor" stroke="none"/>
  <circle cx="14" cy="48" r="2" fill="currentColor" stroke="none"/>
  <circle cx="82" cy="48" r="2" fill="currentColor" stroke="none"/>
</svg>`;

export const LOCK = s(`<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2"/>`);
export const HISTORY = s(`<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/>`);
export const SCROLL_X = s(`<path d="M6 4h9a2 2 0 0 1 2 2v11a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2z"/><path d="M6 4a2 2 0 0 0-2 2v1h2"/><path d="M9 9h5M9 12h5"/>`);
