import { test } from "node:test";
import assert from "node:assert/strict";
import { compactStrokes } from "./strokes";

test("drawings keep finite points and drop empty strokes", () => {
  assert.deepEqual(compactStrokes([[{ x: 1.26, y: 2 }, { x: 3, y: 4.04 }], []]), [
    [{ x: 1.3, y: 2 }, { x: 3, y: 4 }],
  ]);
  assert.equal(compactStrokes("nope"), null);
  assert.equal(compactStrokes([[{ x: Number.NaN, y: 1 }]]), null);
});
