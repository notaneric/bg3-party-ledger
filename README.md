# The Party Ledger — a live BG3 co-op tracker

A shared tarot deck for a four-player Baldur's Gate 3 run. Everyone sees
everyone's progress live; **you can only edit your own card.** Built to show
off *before* the campaign starts (the deck opens as four face-down cards you
each flip to claim), and to run all the way through Act III.

```
deliverables/bg3-party-tracker/
├─ index.html         ← open this
├─ css/styles.css
├─ js/
│  ├─ config.js       ← put your Supabase keys + seat names here
│  ├─ data.js         ← character schema + spoiler-safe story spine
│  ├─ db.js           ← local + live (Supabase) data layer + undo
│  ├─ icons.js        ← authored SVG class emblems / filigree
│  ├─ anim.js         ← GSAP motion
│  └─ app.js          ← render + interaction
├─ schema.sql         ← paste into Supabase to go live
└─ DESIGN.md
```

## Run it right now (no setup)

Because ES modules need HTTP (not `file://`), serve the folder:

```bash
cd "deliverables/bg3-party-tracker"
python -m http.server 5500
# open http://localhost:5500
```

Out of the box it runs in **Local mode** (badge bottom-left): data lives in this
browser only. Perfect for building characters and demoing the look. To sync
across all four of you, do the 3-minute live step below.

## Go live across devices (3 minutes, one-time)

You do this part — it needs *your* account; it's free.

1. Make a project at **supabase.com** (free tier). Wait for it to provision.
2. **SQL Editor → New query →** paste all of `schema.sql` → **Run**.
3. **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. Paste both into `js/config.js`:
   ```js
   export const SUPABASE = {
     url:     "https://xxxx.supabase.co",
     anonKey: "eyJ...",
   };
   ```
5. Reload. Badge flips to **Live · synced** (teal). The app auto-creates the
   four player rows + the story row on first load.
6. **Deploy so friends can reach it:** drag the folder onto
   [app.netlify.com/drop](https://app.netlify.com/drop), or `vercel`, or GitHub
   Pages. Send everyone the URL.

The `anon` key is meant to be public in the browser — safe to commit/deploy.
Don't paste the `service_role` key anywhere client-side.

## How it works

- **Claim a seat.** Click a face-down card → flip → enter your name. The top-left
  "You are" selector remembers who you are on this device.
- **Edit only your card.** Open any card to read it; edit controls (inputs,
  add/remove buttons) appear **only on the card you claimed**. Everyone else's is
  view-only.
- **Four dimensions per hero:** Character & Build (race/class/subclass/multiclass/
  level/abilities/feats), Quests & Choices, Companions & Approval, and
  Journal · Gear · Deaths.
- **Shared Story.** One party-wide spine you all advance together: act progress,
  current location, and a checklist of beats. It's editable by anyone because the
  story is shared. **Spoiler-safe:** only Act I's unavoidable opening beats are
  seeded; Acts II & III stay sealed until someone unseals them.

## Undo (the safety net you asked for)

There's no hard server lock — it's an honor system between four friends. So every
single change is written to the **Chronicle** (button, bottom-right): who changed
what, when, with a before → after diff. If someone fat-fingers an edit (their own
card, the shared story, or — if they picked the wrong seat — someone else's),
open the Chronicle and hit **Undo this change**. It restores the exact prior
state of that record. Undo is itself logged.

## Customize

- **Names/seats:** `js/config.js` → `SEATS` (change `default_name`; keep `slug`).
- **Campaign title/subtitle:** edit them inline on the page (top + the location line).
- **Classes / races / companions** lists: `js/config.js`.

Built by Boris. Authored SVG only — no copyrighted Larian art.
