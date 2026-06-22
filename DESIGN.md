# DESIGN.md — The Party Ledger (BG3 Co-op Tracker)

Per-project design spec. Boris's dark/indigo identity does NOT apply here — this aesthetic comes from the brief.

## Scene sentence
Four friends, late at night on their own laptops, checking what the others did in last night's session — glancing at a glowing tarot deck laid out in a dark room, the way you'd lay cards on a table. Forces: dark, candlelit, tactile, reverent.

## Register
Brand — the design IS the product. This is a show-off artifact, not a utility dashboard. POV over neutrality.

## Slop defense
- First-order reflex ("fantasy → dark + gold + Cinzel parchment") is dodged via **identity-preservation**: BG3's tarot loading-screen cards are the game's actual owned identity, so leaning in is legitimate, not generic-fantasy slop.
- Reflex-reject typeface (Cinzel everywhere) avoided. Specifics below are BG3's real UI register, not D&D-generic.

## Type
- **Display / card titles:** Marcellus SC — inscriptional carved-Roman capitals, reads "engraved on a tarot card," not "fantasy novel cover."
- **Body / journal / descriptions:** EB Garamond — old-manuscript serif, warm, readable at length.
- **Ornate flourish (campaign title only, sparing):** Cinzel Decorative — used once, as a deliberate hero accent, not as system grammar.
- **Micro labels:** Marcellus SC, letter-spaced, small. Never all-caps body.
- Scale: modular, ≥1.25 ratio. Light-on-dark gets +0.06 line-height.

## Color (OKLCH, tinted neutrals, never #000/#fff)
Strategy: **Drenched dark** — the surface IS the world. Committed, no hedging neutrals.

| Token | OKLCH | Role |
|---|---|---|
| `--ink` | oklch(0.15 0.012 80) | near-black warm background |
| `--stone` | oklch(0.225 0.016 135) | BG3 desaturated green-stone panel |
| `--stone-2` | oklch(0.27 0.018 135) | raised panel |
| `--bronze` | oklch(0.66 0.07 78) | aged filigree, frames |
| `--gold` | oklch(0.82 0.11 85) | candlelight accent, sparing |
| `--oxblood` | oklch(0.47 0.14 26) | BG3 logo red — death, danger, important |
| `--parchment` | oklch(0.89 0.028 85) | text on cards, journal |
| `--teal` | oklch(0.6 0.05 190) | companions / approval secondary |

Seat heraldry (4 distinct accents inside the moody palette, so cards read apart):
crimson `oklch(0.5 0.15 25)` · teal `oklch(0.58 0.07 195)` · violet-bronze `oklch(0.55 0.09 320)` · moss `oklch(0.55 0.09 140)`.

## Imagery
No copyrighted BG3 art (ripping Larian assets = wrong). Imagery is **authored SVG**: ornate gilded card frames, 12 class emblems (rune-style glyphs), a face-down tarot back with filigree, d20 motif. Per brand.md, custom SVG counts as imagery — colored-div placeholders are banned.

## Motion (GSAP, all free)
- Page load: deck **deals in** — cards arc/stagger into place (power3.out), once.
- Hover: card lifts + a gold **foil shimmer** sweeps the frame.
- Click: card **flips/expands** to the full sheet (Flip-style takeover).
- Count-ups: level, approval values tick up.
- Gate everything non-essential behind `prefers-reduced-motion`. No bounce/elastic. Durations ≤0.8s on feedback.

## Layout
Deck is the centerpiece — 4 cards, not a card-grid template. Expanded sheet is a full takeover with the four dimension sections (Character & Build · Quests & Choices · Companions & Approval · Journal / Gear / Deaths). Shared Story spine sits apart as a party-wide panel. Asymmetric, not centered-stack.

## Empty state (they haven't started)
Unclaimed seats render as **face-down tarot backs** ("Awaiting their tale" / "Claim this card"). The face-down deck IS the show-off reveal moment. Flipping a card claims the seat and opens the editable sheet.

## Bans (project-specific, on top of impeccable's)
- No real BG3 screenshots/portraits (copyright).
- No Cinzel as the system font.
- No spoilers seeded into the shared story panel beyond unavoidable opening beats — Acts 2-3 stay sealed until reached.
- No hard server-side edit lock (honor-system by design); every write is logged for undo instead.
