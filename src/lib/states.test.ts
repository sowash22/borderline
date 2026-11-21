import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countries,
  findPlace,
  indianStates,
  popularIndianStates,
  popularUsStates,
  usStates,
} from "./places";
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

test("Indian states include Tamil Nadu and skip tiny union territories", () => {
  assert.ok(indianStates.length >= 28);
  assert.equal(new Set(indianStates.map((state) => state.id)).size, indianStates.length);
  assert.ok(indianStates.some((state) => state.code === "TN" && state.name === "Tamil Nadu"));
  assert.ok(indianStates.some((state) => state.code === "MH" && state.name === "Maharashtra"));
  assert.ok(indianStates.some((state) => state.name === "Odisha"));
  assert.equal(indianStates.some((state) => state.name === "Lakshadweep"), false);
  for (const state of indianStates) {
    assert.match(state.id, /^I-[A-Z]{2}$/);
    assert.equal(findPlace(state.id)?.name, state.name);
    assert.equal(usStates.some((place) => place.id === state.id), false);
    const outline = state.rings.map((ring) => ring.map(([x, y]) => ({ x, y })));
    assert.equal(shapeScore(outline, outline), 100, state.name);
  }
});

test("the states picker leads with familiar US and Indian places", () => {
  assert.deepEqual(popularUsStates.map((place) => place.name).slice(0, 4), ["California", "Texas", "New York", "Florida"]);
  assert.ok(popularIndianStates.some((place) => place.name === "Tamil Nadu"));
  assert.ok(popularIndianStates.some((place) => place.name === "Maharashtra"));
});
