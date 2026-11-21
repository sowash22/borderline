import { test } from "node:test";
import assert from "node:assert/strict";
import { challengeLine, parseBeat } from "./challenge";
import { acceptScore, bestToday, nextBest, normalizeNickname } from "./board";

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

test("today's board keeps each player's highest score from any country", () => {
  const board = bestToday([
    { nickname: "pounce4821", score: 40, countryId: "360" },
    { nickname: "pounce4821", score: 80, countryId: "380" },
    { nickname: "oscar1901", score: 70, countryId: "004" },
  ]);
  assert.deepEqual(board, [
    { nickname: "pounce4821", score: 80, countryId: "380" },
    { nickname: "oscar1901", score: 70, countryId: "004" },
  ]);
});

test("a later lower score does not replace the day's best", () => {
  assert.deepEqual(nextBest(null, 40), { score: 40, replace: true });
  assert.deepEqual(nextBest(40, 80), { score: 80, replace: true });
  assert.deepEqual(nextBest(80, 40), { score: 80, replace: false });
  assert.equal(acceptScore(80), 80);
  assert.equal(acceptScore(80.5), null);
  assert.equal(acceptScore(-1), null);
});
