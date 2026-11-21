import { test } from "node:test";
import assert from "node:assert/strict";
import { ensurePlayerName, generateNickname, petNames } from "./nicknames";

test("one hundred unique pet names", () => {
  assert.equal(petNames.length, 100);
  assert.equal(new Set(petNames).size, 100);
});

test("a player name is a lowercase pet plus four digits", () => {
  assert.equal(generateNickname(4821, 0), "mochi4821");
  assert.equal(generateNickname(7, 0.99), "winnie0007");
});

test("a short saved name stays, and a long one is replaced", () => {
  assert.equal(ensurePlayerName("Pounce4821", 5, 0), "pounce4821");
  assert.equal(ensurePlayerName("Pounce 1795240549909", 5, 0), "mochi0005");
  assert.equal(ensurePlayerName(null, 5, 0), "mochi0005");
});
