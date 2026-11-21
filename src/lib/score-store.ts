import { bestByPlace, type StoredScore } from "./board";
import type { Stroke } from "./scoring";
import { compactStrokes } from "./strokes";

type Row = {
  id: string;
  nickname: string;
  score: number;
  country_id: string;
  strokes?: unknown;
  reaction?: unknown;
  day?: string;
  created_at?: string;
};

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

function asScore(row: Row): StoredScore | null {
  if (typeof row.nickname !== "string" || typeof row.country_id !== "string") return null;
  if (typeof row.score !== "number" || !Number.isInteger(row.score)) return null;
  const reaction = typeof row.reaction === "number" && Number.isInteger(row.reaction) ? row.reaction : 0;
  return {
    id: row.id,
    nickname: row.nickname,
    score: row.score,
    countryId: row.country_id,
    strokes: compactStrokes(row.strokes),
    reaction,
  };
}

async function selectRows(filter: string): Promise<Row[]> {
  const selects = [
    "id,nickname,score,country_id,strokes,reaction,created_at,day",
    "id,nickname,score,country_id,strokes,created_at,day",
    "id,nickname,score,country_id,created_at,day",
  ];
  let last: unknown;
  for (const select of selects) {
    try {
      return await rest<Row[]>(`daily_scores?${filter}&select=${select}`) ?? [];
    } catch (error) {
      last = error;
      if (!(error instanceof StoreError) || !/strokes|reaction|42703|PGRST204/i.test(error.message)) throw error;
    }
  }
  throw last;
}

export async function listDailyScores(): Promise<StoredScore[]> {
  const rows = await selectRows("order=score.desc,created_at.desc&limit=400");
  return bestByPlace(rows.flatMap((row) => {
    const score = asScore(row);
    return score ? [score] : [];
  }));
}

async function insertAttempt(payload: Record<string, unknown>): Promise<void> {
  const body = { ...payload };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await rest("daily_scores", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(body),
      });
      return;
    } catch (error) {
      if (!(error instanceof StoreError) || !/42703|PGRST204/i.test(error.message)) throw error;
      if (/strokes/i.test(error.message) && "strokes" in body) {
        delete body.strokes;
        continue;
      }
      if (/reaction/i.test(error.message) && "reaction" in body) {
        delete body.reaction;
        continue;
      }
      throw error;
    }
  }
}

export type SavedDrawing = {
  id: string;
  countryId: string;
  score: number;
  day: string;
  strokes: Stroke[] | null;
  reaction: number;
};

export async function listPlayerDrawings(nickname: string): Promise<SavedDrawing[]> {
  const rows = await selectRows(`nickname=eq.${encodeURIComponent(nickname)}&order=created_at.desc&limit=80`);
  return rows.flatMap((row) => {
    const score = asScore(row);
    if (!score) return [];
    return [{
      id: score.id,
      countryId: score.countryId,
      score: score.score,
      day: row.day ?? "",
      strokes: score.strokes,
      reaction: score.reaction,
    }];
  });
}

export async function saveDailyScore(input: {
  nickname: string;
  nicknameKey: string;
  countryId: string;
  score: number;
  day: string;
  strokes: Stroke[] | null;
  reaction: number;
}): Promise<{ score: number }> {
  const attemptKey = `${input.nicknameKey}:${input.countryId}:${crypto.randomUUID()}`;
  await insertAttempt({
    nickname: input.nickname,
    nickname_key: attemptKey,
    country_id: input.countryId,
    score: input.score,
    day: input.day,
    strokes: input.strokes,
    reaction: input.reaction,
  });
  return { score: input.score };
}
