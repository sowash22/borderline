import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyCountry, dailyIndex, shiftDay, utcDay, yesterdayCountry } from "./daily";

test("utc day is a calendar date", () => {
  assert.equal(utcDay(new Date("2026-11-21T07:30:00.000Z")), "2026-11-21");
  assert.equal(utcDay(new Date("2026-11-20T23:30:00.000Z")), "2026-11-20");
});

test("the same day always picks the same country", () => {
  const first = dailyCountry("2026-11-20");
  const second = dailyCountry("2026-11-20");
  assert.equal(first.id, second.id);
  assert.match(first.id, /^\d{3}$/);
  assert.equal(dailyIndex("2026-11-20", 238), dailyIndex("2026-11-20", 238));
});

test("yesterday is the country from the previous utc day", () => {
  assert.equal(shiftDay("2026-11-21", -1), "2026-11-20");
  assert.equal(yesterdayCountry("2026-11-21").id, dailyCountry("2026-11-20").id);
  assert.notEqual(yesterdayCountry("2026-11-21").id, dailyCountry("2026-11-21").id);
});

test("the day index stays inside the country list", () => {
  assert.equal(dailyIndex("2026-11-20", 1), 0);
  const index = dailyIndex("2026-11-20", 238);
  assert.ok(index >= 0 && index < 238);
  assert.notEqual(dailyCountry("2026-11-20").id, dailyCountry("2026-11-21").id);
});
