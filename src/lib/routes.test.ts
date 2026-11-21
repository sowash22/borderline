import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRoute } from "./routes";

test("paths round-trip through the game routes", () => {
  assert.deepEqual(parseRoute("/"), { view: "home" });
  assert.deepEqual(parseRoute("/scores"), { view: "scores" });
  assert.deepEqual(parseRoute("/place/380"), { view: "place", placeId: "380" });
  assert.deepEqual(parseRoute("/place/S06/draw"), { view: "draw", placeId: "S06" });
  assert.deepEqual(parseRoute("/place/S06/result"), { view: "result", placeId: "S06" });
  assert.deepEqual(parseRoute("/player/pounce4821"), { view: "player", player: "pounce4821" });
  assert.deepEqual(parseRoute("/player/pounce4821/380"), {
    view: "compare",
    player: "pounce4821",
    placeId: "380",
  });
});
