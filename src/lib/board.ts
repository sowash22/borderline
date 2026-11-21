export const nicknameStorageKey = "borderline:nickname";

export type BoardEntry = {
  nickname: string;
  score: number;
  countryId: string;
  countryName: string;
  flag: string;
};

export type StoredScore = {
  nickname: string;
  score: number;
  countryId: string;
};

export type DailyBoard = {
  configured: boolean;
  entries: BoardEntry[];
};

export function normalizeNickname(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const nickname = value.trim().replace(/\s+/g, " ");
  if (nickname.length < 2 || nickname.length > 40) return null;
  if (!/^[\p{L}\p{M}\p{N} ]+$/u.test(nickname)) return null;
  if (!/[\p{L}\p{N}]/u.test(nickname)) return null;
  return nickname;
}

export function acceptScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value > 100) return null;
  return value;
}

export function bestToday(rows: StoredScore[]): StoredScore[] {
  const best = new Map<string, StoredScore>();
  for (const row of rows) {
    const key = row.nickname.toLowerCase();
    const current = best.get(key);
    if (!current || row.score > current.score) best.set(key, row);
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
    .slice(0, 10);
}

export function nextBest(
  current: number | null,
  incoming: number,
): { score: number; replace: boolean } {
  if (current == null || incoming > current) return { score: incoming, replace: true };
  return { score: current, replace: false };
}
