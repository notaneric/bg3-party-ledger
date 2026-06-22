-- ============================================================
-- THE PARTY LEDGER — Supabase schema
-- Paste this whole file into: Supabase > SQL Editor > New query > Run.
-- Honor-system by design: anon can read AND write everything (4 trusted
-- friends, no logins). The app logs every change so accidental edits are
-- undoable. If you ever want real per-seat locks, see the note at bottom.
-- ============================================================

-- 1. Tables -------------------------------------------------
create table if not exists public.players (
  slug text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.story (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.edit_log (
  id text primary key,
  entry jsonb not null,
  created_at timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists t_players_touch on public.players;
create trigger t_players_touch before update on public.players
  for each row execute function public.touch_updated_at();

drop trigger if exists t_story_touch on public.story;
create trigger t_story_touch before update on public.story
  for each row execute function public.touch_updated_at();

-- 2. Row Level Security (permissive — honor system) ----------
alter table public.players  enable row level security;
alter table public.story    enable row level security;
alter table public.edit_log enable row level security;

-- allow anon full access (read + write). Drop-and-create to stay idempotent.
do $$
declare t text;
begin
  foreach t in array array['players','story','edit_log'] loop
    execute format('drop policy if exists "open_all" on public.%I', t);
    execute format(
      'create policy "open_all" on public.%I for all
         to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- 3. Realtime ------------------------------------------------
-- Add the tables to the realtime publication so the app live-syncs.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.story;
alter publication supabase_realtime add table public.edit_log;

-- Done. The app seeds the 4 player rows + the story row on first load.
-- ------------------------------------------------------------
-- OPTIONAL hard locks (not honor-system): if you later add Supabase Auth,
-- replace the players "open_all" policy with one that checks
-- auth.uid() against an owner column, so each person can only UPDATE their
-- own row. The app's view-everything / edit-your-own UI already matches that.
