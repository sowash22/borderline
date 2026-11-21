-- Daily score board for Borderline.
-- The game runs without this table.
-- To turn the board on, run this in the Supabase SQL editor, then set
-- SUPABASE_URL and SUPABASE_SECRET_KEY on the server.
-- Scores only. Drawings stay on the player's device.
-- One player can keep a score for more than one country on the same day.
-- The game stores those as separate rows and shows each player's highest score.

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  nickname_key text not null,
  country_id text not null,
  score integer not null check (score >= 0 and score <= 100),
  day date not null,
  created_at timestamptz not null default now(),
  unique (nickname_key, day)
);

alter table public.daily_scores enable row level security;
