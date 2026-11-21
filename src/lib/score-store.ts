import { bestToday, nextBest, type StoredScore } from "./board";
import type { Stroke } from "./scoring";

type Row = { id: string; nickname: string; score: number; country_id: string };

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function boardConfigured(): boolean {
  return config() != null;
}

class StoreError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = config();
  if (!supabase) throw new StoreError("Score board is not configured.", 503);
  const response = await fetch(`${supabase.url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: supabase.key,
      Authorization: `Bearer ${supabase.key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new StoreError(detail.slice(0, 240), response.status);
  }
  if (response.status === 204) return null as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function listDailyScores(day: string): Promise<StoredScore[]> {
  const rows = await rest<Row[]>(
    `daily_scores?day=eq.${day}&select=nickname,score,country_id&order=score.desc,nickname.asc&limit=200`,
  );
  const scores = (rows ?? [])
    .filter(
      (row) =>
        typeof row.nickname === "string" &&
        typeof row.country_id === "string" &&
        typeof row.score === "number" &&
        Number.isInteger(row.score),
    )
    .map((row) => ({
      nickname: row.nickname,
      score: row.score,
      countryId: row.country_id,
    }));
  return bestToday(scores);
}

async function writeRow(path: string, method: "POST" | "PATCH", payload: Record<string, unknown>, strokes: Stroke[] | null) {
  const body = { ...payload };
  if (strokes) body.strokes = strokes;
  try {
    await rest(path, {
      method,
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (!strokes || !(error instanceof StoreError) || !/strokes|PGRST204/i.test(error.message)) throw error;
    delete body.strokes;
    await rest(path, {
      method,
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
  }
}

export type SavedDrawing = {
  countryId: string;
  score: number;
  day: string;
  strokes: Stroke[] | null;
};

export async function listPlayerDrawings(nickname: string): Promise<SavedDrawing[]> {
  const rows = await rest<Array<SavedDrawing & { country_id: string; strokes: unknown }>>(
    `daily_scores?nickname=eq.${encodeURIComponent(nickname)}&select=country_id,score,day,strokes,created_at&order=created_at.desc&limit=60`,
  );
  return (rows ?? []).map((row) => ({
    countryId: row.country_id,
    score: row.score,
    day: row.day,
    strokes: Array.isArray(row.strokes) ? (row.strokes as Stroke[]) : null,
  }));
}

export async function saveDailyScore(input: {
  nickname: string;
  nicknameKey: string;
  countryId: string;
  score: number;
  day: string;
  strokes: Stroke[] | null;
}): Promise<{ score: number; kept: boolean }> {
  const scopedKey = `${input.nicknameKey}:${input.countryId}`;
  const existing = await rest<Row[]>(
    `daily_scores?day=eq.${input.day}&or=(nickname_key.eq.${encodeURIComponent(scopedKey)},and(nickname_key.eq.${encodeURIComponent(input.nicknameKey)},country_id.eq.${input.countryId}))&select=id,nickname,score,country_id&limit=1`,
  );
  const current = existing?.[0] ?? null;
  const decision = nextBest(current?.score ?? null, input.score);
  if (!decision.replace) return { score: decision.score, kept: true };
  if (current) {
    await writeRow(`daily_scores?id=eq.${current.id}`, "PATCH", {
      score: input.score,
      country_id: input.countryId,
      nickname_key: scopedKey,
    }, input.strokes);
    return { score: input.score, kept: false };
  }
  try {
    await writeRow("daily_scores", "POST", {
      nickname: input.nickname,
      nickname_key: scopedKey,
      country_id: input.countryId,
      score: input.score,
      day: input.day,
    }, input.strokes);
  } catch (error) {
    if (!(error instanceof StoreError) || error.status !== 409) throw error;
    const again = await rest<Row[]>(
      `daily_scores?day=eq.${input.day}&or=(nickname_key.eq.${encodeURIComponent(scopedKey)},and(nickname_key.eq.${encodeURIComponent(input.nicknameKey)},country_id.eq.${input.countryId}))&select=id,nickname,score,country_id&limit=1`,
    );
    const raced = again?.[0];
    if (!raced) throw error;
    const retry = nextBest(raced.score, input.score);
    if (!retry.replace) return { score: retry.score, kept: true };
    await writeRow(`daily_scores?id=eq.${raced.id}`, "PATCH", {
      score: input.score,
      country_id: input.countryId,
      nickname_key: scopedKey,
    }, input.strokes);
  }
  return { score: input.score, kept: false };
}
