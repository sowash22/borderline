import { test } from "node:test";
import assert from "node:assert/strict";
import { shapeScore, type Stroke } from "./scoring";
const square: Stroke[] = [
  [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
    { x: 0, y: 0 },
  ],
];
test("empty and tiny marks score zero", () => {
  assert.equal(shapeScore([], square), 0);
  assert.equal(
    shapeScore(
      [
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 0 },
        ],
      ],
      square,
    ),
    0,
  );
});
test("translation and uniform scale do not change the score", () => {
  const translated = square.map((s) =>
    s.map((p) => ({ x: p.x * 2 + 50, y: p.y * 2 + 70 })),
  );
  assert.equal(shapeScore(translated, square), 100);
});
test("a missing edge loses coverage and a different aspect ratio loses similarity", () => {
  assert.ok(shapeScore([square[0].slice(0, 4)], square) < 90);
  const stretched = square.map((s) => s.map((p) => ({ ...p, x: p.x * 4 })));
  assert.ok(shapeScore(stretched, square) < 70);
});
