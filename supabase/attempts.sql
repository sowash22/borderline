-- Run this once in the Supabase SQL editor.
-- Every drawing is its own row. The leaderboard still shows each player's
-- highest score for a place. Older rows stay.
-- strokes keeps the drawing. reaction keeps the joke shown with that score.

alter table public.daily_scores
  add column if not exists strokes jsonb;

alter table public.daily_scores
  add column if not exists reaction smallint;

alter table public.daily_scores
  drop constraint if exists daily_scores_nickname_key_day_key;
