import { normalizeNickname } from "@/lib/board";
import { findPlace } from "@/lib/places";
import { boardConfigured, listPlayerDrawings } from "@/lib/score-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const nickname = normalizeNickname(new URL(request.url).searchParams.get("nickname"));
  if (!nickname || !boardConfigured()) return Response.json({ drawings: [] });
  try {
    const rows = await listPlayerDrawings(nickname);
    const drawings = rows.flatMap((row) => {
      const place = findPlace(row.countryId);
      if (!place) return [];
      return [{
        countryId: place.id,
        countryName: place.name,
        flag: place.flag,
        score: row.score,
        day: row.day,
        strokes: row.strokes,
      }];
    });
    return Response.json({ drawings });
  } catch {
    return Response.json({ drawings: [], stored: false });
  }
}
