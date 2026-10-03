import { test } from "node:test";
import assert from "node:assert/strict";
import maps from "./maps.json";
import { shapeScore } from "./scoring";

test("broad country coverage has unique country codes and includes small countries", () => {
  assert.ok(maps.length >= 230);
  assert.equal(new Set(maps.map(map => map.id)).size, maps.length);
  assert.equal(new Set(maps.map(map => map.code)).size, maps.length);
  for (const code of ["US", "CA", "IN", "CN", "RU", "SG", "MV", "MC", "VA", "FJ"]) {
    assert.ok(maps.some(map => map.code === code), `Missing ${code}`);
  }
});

test("every outline fits the canvas and uses closed, finite scoring rings", () => {
  for (const map of maps) {
    assert.match(map.id, /^\d{3}$/);
    assert.ok(map.path && map.rings.length, map.name);
    for (const ring of map.rings) {
      assert.ok(ring.length >= 4, map.name);
      assert.deepEqual(ring[0], ring.at(-1), map.name);
      for (const [x, y] of ring) {
        assert.ok(Number.isFinite(x) && Number.isFinite(y), map.name);
        assert.ok(x >= 64 && x <= 536 && y >= 39 && y <= 361, `${map.name}: ${x},${y}`);
      }
    }
    const outline = map.rings.map(ring => ring.map(([x, y]) => ({ x, y })));
    assert.equal(shapeScore(outline, outline), 100, map.name);
  }
});
