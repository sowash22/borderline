import type { Stroke } from "./scoring";

export function compactStrokes(value: unknown): Stroke[] | null {
  if (!Array.isArray(value) || value.length > 40) return null;
  const strokes: Stroke[] = [];
  let points = 0;
  for (const stroke of value) {
    if (!Array.isArray(stroke)) return null;
    const next: Stroke = [];
    for (const point of stroke) {
      if (!point || typeof point !== "object") return null;
      const x = (point as { x?: unknown }).x;
      const y = (point as { y?: unknown }).y;
      if (typeof x !== "number" || typeof y !== "number") return null;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      next.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
      points += 1;
      if (points > 4000) return null;
    }
    if (next.length) strokes.push(next);
  }
  return strokes;
}
