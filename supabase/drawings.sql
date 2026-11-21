-- Run this once in the Supabase SQL editor.
-- It lets each saved score keep the drawing that earned it.

alter table public.daily_scores
  add column if not exists strokes jsonb;
