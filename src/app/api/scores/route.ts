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
      nickname: entry.nickname,
      score: entry.score,
      countryId: country.id,
      countryName: country.name,
      flag: country.flag,
    }];
  });
}

export async function GET() {
  if (!boardConfigured()) return Response.json(emptyBoard());
  try {
    const entries = present(await listDailyScores(utcDay()));
    return Response.json({ configured: true, entries } satisfies DailyBoard);
  } catch {
    return Response.json({ message: "Couldn’t load today’s board." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!boardConfigured()) {
    return Response.json({ message: "Today’s board is unavailable." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const nickname = normalizeNickname(body?.nickname);
  const score = acceptScore(body?.score);
  const countryId = typeof body?.countryId === "string" ? body.countryId : "";
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
    });
    const entries = present(await listDailyScores(utcDay()));
    return Response.json({
      kept: saved.kept,
      score: saved.score,
      board: { configured: true, entries } satisfies DailyBoard,
    });
  } catch {
    return Response.json({ message: "Couldn’t post that score." }, { status: 500 });
  }
}
