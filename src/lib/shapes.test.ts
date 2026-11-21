import { test } from "node:test";
import assert from "node:assert/strict";
import { extraShapes, findPlace, subjectFor } from "./places";
import { shapeScore } from "./scoring";
import { verdict } from "./reactions";

test("extra outlines stay on the canvas and score as themselves", () => {
  assert.equal(extraShapes.length, 24);
  assert.equal(new Set(extraShapes.map((place) => place.id)).size, extraShapes.length);
  for (const place of extraShapes) {
    assert.ok(findPlace(place.id));
    assert.ok(place.path && place.rings.length, place.name);
    for (const ring of place.rings) {
      assert.ok(ring.length >= 4, place.name);
      for (const [x, y] of ring) {
        assert.ok(x >= 64 && x <= 536 && y >= 39 && y <= 361, `${place.name}: ${x},${y}`);
      }
    }
    const outline = place.rings.map((ring) => ring.map(([x, y]) => ({ x, y })));
    assert.equal(shapeScore(outline, outline), 100, place.name);
  }
});

test("a fruit joke talks about the fruit, not a country", () => {
  const reaction = verdict(30, false, 0, subjectFor({ kind: "fruit" }));
  assert.match(reaction.title, /fruit/i);
  assert.doesNotMatch(reaction.title, /country/i);
});
