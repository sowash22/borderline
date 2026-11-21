import { test } from "node:test";
import assert from "node:assert/strict";
import { countries, usStates } from "./places";
import { shapeScore } from "./scoring";

test("state outlines are the fifty states plus Washington DC", () => {
  assert.equal(usStates.length, 51);
  assert.equal(new Set(usStates.map((state) => state.id)).size, usStates.length);
  assert.ok(usStates.some((state) => state.code === "CA" && state.name === "California"));
  assert.ok(usStates.some((state) => state.code === "DC"));
  assert.equal(usStates.some((state) => state.name === "Guam"), false);
  for (const state of usStates) {
    assert.match(state.id, /^S\d{2}$/);
    assert.equal(countries.some((country) => country.id === state.id), false);
    assert.ok(state.rings.length >= 1, state.name);
  }
});

test("a state outline scores as itself", () => {
  const california = usStates.find((state) => state.code === "CA")!;
  const outline = california.rings.map((ring) => ring.map(([x, y]) => ({ x, y })));
  assert.equal(shapeScore(outline, outline), 100);
});
