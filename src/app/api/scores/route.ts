import { acceptScore, normalizeNickname, type BoardEntry, type DailyBoard } from "@/lib/board";
import { utcDay } from "@/lib/daily";
import { findPlace } from "@/lib/places";
import { boardConfigured, listDailyScores, saveDailyScore } from "@/lib/score-store";
import { compactStrokes } from "@/lib/strokes";

export const dynamic = "force-dynamic";

function emptyBoard(): DailyBoard {
  return { configured: false, entries: [] };
}

function present(entries: Awaited<ReturnType<typeof listDailyScores>>): BoardEntry[] {
  return entries.flatMap((entry) => {
    const country = findPlace(entry.countryId);
    if (!country) return [];
    return [{
      id: entry.id,
      nickname: entry.nickname,
      score: entry.score,
      countryId: country.id,
      countryName: country.name,
      flag: country.flag,
      path: country.path,
      strokes: entry.strokes,
      reaction: entry.reaction,
    }];
  });
}

export async function GET() {
  if (!boardConfigured()) return Response.json(emptyBoard());
  try {
    const entries = present(await listDailyScores());
    return Response.json({ configured: true, entries } satisfies DailyBoard);
  } catch {
    return Response.json({ message: "Couldn’t load the leaderboard." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!boardConfigured()) {
    return Response.json({ message: "The leaderboard is unavailable." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const nickname = normalizeNickname(body?.nickname);
  const score = acceptScore(body?.score);
  const countryId = typeof body?.countryId === "string" ? body.countryId : "";
  const reaction = typeof body?.reaction === "number" && Number.isInteger(body.reaction)
    ? Math.abs(body.reaction) % 10
    : 0;
  if (!nickname) {
    return Response.json({ message: "That nickname can’t be posted." }, { status: 400 });
  }
  if (score == null) {
    return Response.json({ message: "That score can’t be posted." }, { status: 400 });
  }
  if (!findPlace(countryId)) {
    return Response.json({ message: "That country can’t be posted." }, { status: 400 });
  }
  try {
    const saved = await saveDailyScore({
      nickname,
      nicknameKey: nickname.toLocaleLowerCase(),
      countryId,
      score,
      day: utcDay(),
      strokes: compactStrokes(body?.strokes),
      reaction,
    });
    const entries = present(await listDailyScores());
    return Response.json({
      score: saved.score,
      board: { configured: true, entries } satisfies DailyBoard,
    });
  } catch {
    return Response.json({ message: "Couldn’t post that score." }, { status: 500 });
  }
}
