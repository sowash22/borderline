export type Point = { x: number; y: number };
export type Stroke = Point[];
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function normalize(
  strokes: Stroke[],
  width = 420,
  height = 280,
  xOffset = 90,
  yOffset = 60,
): Stroke[] {
  const points = strokes.flat();
  if (!points.length) return [];
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const left = Math.min(...xs),
    top = Math.min(...ys),
    w = Math.max(...xs) - left,
    h = Math.max(...ys) - top;
  const scale = Math.min(width / Math.max(w, 1), height / Math.max(h, 1));
  return strokes.map((s) =>
    s.map((p) => ({
      x: (p.x - left) * scale + xOffset + (width - w * scale) / 2,
      y: (p.y - top) * scale + yOffset + (height - h * scale) / 2,
    })),
  );
}

function sample(strokes: Stroke[], count = 240): Point[] {
  const segments: { a: Point; b: Point; length: number }[] = [];
  for (const stroke of strokes)
    for (let i = 1; i < stroke.length; i++) {
      const length = distance(stroke[i - 1], stroke[i]);
      if (length > 0) segments.push({ a: stroke[i - 1], b: stroke[i], length });
    }
  const total = segments.reduce((s, v) => s + v.length, 0);
  if (!total) return [];
  const output: Point[] = [];
  let index = 0,
    passed = 0;
  for (let i = 0; i < count; i++) {
    const at = (total * i) / (count - 1);
    while (
      index < segments.length - 1 &&
      passed + segments[index].length < at
    ) {
      passed += segments[index++].length;
    }
    const { a, b, length } = segments[index];
    const t = Math.min(1, (at - passed) / length);
    output.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return output;
}

// Symmetric outline distance, preserving orientation and aspect ratio while ignoring size/position.
export function shapeScore(drawing: Stroke[], reference: Stroke[]): number {
  const raw = drawing.flat();
  if (raw.length < 4) return 0;
  const extent =
    Math.max(...raw.map((p) => p.x)) -
    Math.min(...raw.map((p) => p.x)) +
    Math.max(...raw.map((p) => p.y)) -
    Math.min(...raw.map((p) => p.y));
  if (extent < 15) return 0;
  const a = sample(normalize(drawing)),
    b = sample(normalize(reference));
  if (!a.length || !b.length) return 0;
  const directed = (from: Point[], to: Point[]) =>
    from.reduce(
      (sum, p) => sum + Math.min(...to.map((q) => distance(p, q))),
      0,
    ) / from.length;
  const gap = (directed(a, b) + directed(b, a)) / 2;
  return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-gap / 36))));
}

export function strokePath(stroke: Stroke): string {
  if (!stroke.length) return "";
  if (stroke.length === 1) return `M${stroke[0].x},${stroke[0].y}l.01,0`;
  return stroke
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

export { verdict } from "./reactions";
