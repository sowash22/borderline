import { test } from "node:test";
import assert from "node:assert/strict";
import { revealResponses, verdict } from "./reactions";

test("100 distinct reactions, with ten options for every score band", () => {
  assert.equal(revealResponses.length, 100);
  assert.equal(new Set(revealResponses.map(r => r.title)).size, 100);
  for (let band = 0; band < 10; band++) {
    assert.equal(revealResponses.filter(r => r.min === band * 10).length, 10);
    for (let variant = 0; variant < 10; variant++) {
      const reaction = verdict(band * 10, false, variant);
      assert.equal(reaction.title, revealResponses[band * 10 + variant].title);
      assert.deepEqual(verdict(band * 10 + 9, false, variant), reaction);
      assert.ok(reaction.line && reaction.emoji);
    }
  }
});
test("perfect scores, blank drawings, and saved reactions stay consistent", () => {
  assert.deepEqual(verdict(100, false, 9), verdict(90, false, 9));
  assert.deepEqual(verdict(0, true, 0), verdict(100, true, 9));
  assert.match(verdict(0, true).title, /invisible country/);
  assert.deepEqual(verdict(75, false, 3), verdict(75, false, 3));
  assert.deepEqual(verdict(-20, false), verdict(0, false));
  assert.deepEqual(verdict(NaN, false), verdict(0, false));
});
