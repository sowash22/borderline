import { test } from "node:test";
import assert from "node:assert/strict";
import { challengeLine, parseBeat } from "./challenge";
import { acceptScore, bestByPlace, nextBest, normalizeNickname } from "./board";

test("challenge links only carry a whole score from 0 to 100", () => {
  assert.equal(parseBeat("72"), 72);
  assert.equal(parseBeat("0"), 0);
  assert.equal(parseBeat("100"), 100);
  assert.equal(parseBeat("101"), null);
  assert.equal(parseBeat("7.5"), null);
  assert.equal(parseBeat("nope"), null);
  assert.equal(parseBeat(null), null);
});

test("the result says who leads", () => {
  assert.equal(challengeLine(80, 72), "You beat 72%.");
  assert.equal(challengeLine(72, 72), "You tied 72%.");
  assert.equal(challengeLine(40, 72), "72% still leads.");
});

test("nicknames stay short and plain", () => {
  assert.equal(normalizeNickname("  Ada  Lovelace "), "Ada Lovelace");
  assert.equal(normalizeNickname("सौ"), "सौ");
  assert.equal(normalizeNickname("a"), null);
  assert.equal(normalizeNickname("hello.com"), null);
  assert.equal(normalizeNickname("pounce4821"), "pounce4821");
  assert.equal(normalizeNickname("x".repeat(41)), null);
});

test("each place keeps its own all-time high for a player", () => {
  const board = bestByPlace([
    { id: "a", nickname: "pounce4821", score: 40, countryId: "360", strokes: null, reaction: 1 },
    { id: "b", nickname: "pounce4821", score: 80, countryId: "380", strokes: null, reaction: 2 },
    { id: "c", nickname: "pounce4821", score: 55, countryId: "380", strokes: null, reaction: 3 },
    { id: "d", nickname: "oscar1901", score: 70, countryId: "004", strokes: null, reaction: 4 },
  ]);
  assert.deepEqual(
    board.map((row) => row.id),
    ["b", "d", "a"],
  );
});

test("a later lower score does not replace the day's best", () => {
  assert.deepEqual(nextBest(null, 40), { score: 40, replace: true });
  assert.deepEqual(nextBest(40, 80), { score: 80, replace: true });
  assert.deepEqual(nextBest(80, 40), { score: 80, replace: false });
  assert.equal(acceptScore(80), 80);
  assert.equal(acceptScore(80.5), null);
  assert.equal(acceptScore(-1), null);
});
