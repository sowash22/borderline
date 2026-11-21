# Borderline

A geography drawing game. Pick a country, a US state, or an Indian state, draw the outline from memory, then see how close you got.

There is one all-time leaderboard. Click a row to open that drawing. Click **Leaderboard** on the home page for the full board.

Built with Next.js App Router, React, and TypeScript.

## Run locally

```sh
npm ci
npm run dev
```

## Validate

```sh
npm run typecheck
npm test
npm run build
```

## How a round works

- Shuffle to a random place, or pick from Country / State.
- The State list leads with familiar US and Indian places, then the rest.
- Draw with a finger, mouse, or stylus. Untimed. Undo and clear are available.
- Reveal whenever you want. Your drawing sits next to the real outline.
- Size and position do not matter. Rotation and aspect ratio do.
- A short authored joke reacts to the score. The text is not AI-generated.

Personal bests stay in local storage on this device. Scores can also land on the shared leaderboard when Supabase is configured. Drawings are only exported as a PNG or challenge link when the player chooses.

## How the score is calculated

The score is a playful shape match from 0 to 100, not a geography exam.

1. A blank canvas, a scribble with fewer than four points, or a mark smaller than 15 pixels scores **0**.
2. The drawing and the real outline are each **normalized**: moved and uniformly scaled into the same box. Translation and size are ignored. Stretching or rotating the shape is not.
3. Each outline is sampled at **240 points** along its path, so a long coastline and a short one can still be compared.
4. For every sample on your drawing, the nearest sample on the real outline is measured, then the same thing the other way. Those two average distances are combined (symmetric outline distance).
5. The gap becomes a percentage: `round(100 × e^(-gap / 36))`, then clamped to 0–100.

A perfect self-match of the real outline scores 100. Missing a side, or drawing Italy as a pancake, drops the score. The formula lives in `src/lib/scoring.ts` as `shapeScore`.

## Other shapes (`draw-shapes`)

Main stays a map game. An experiment lives on the **`draw-shapes`** branch: the same loop, plus animals, objects, fruits, and simple shapes (cat, apple, star, and so on). You pick a category, then a random or chosen item. Scoring is the same outline match. Jokes swap “country” for “animal”, “fruit”, and so on. One leaderboard still holds every attempt.

That branch is on both remotes. It is not merged, because extra categories diluted the geography toy. To try it:

```sh
git checkout draw-shapes
npm run dev
```

## Map data

Country outlines come from `world-atlas` 2.0.2 (Natural Earth, public domain). Run `npm run maps` to rebuild them. Small islands and distant overseas territories are dropped so the drawing stays playable. France is the European mainland and nearby islands. The US country outline is the contiguous 48.

US states come from `us-atlas`. Indian states are built from public GeoJSON (`npm run india-states`); tiny union territories are omitted. Maps are game references, not legal boundaries.

Sources: https://github.com/topojson/world-atlas, https://www.naturalearthdata.com/about/terms-of-use/

## Vercel

Import this repository in Vercel. Framework: Next.js. Build: `npm run build`. Root: the repository root.

The leaderboard needs `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`). Without them the game still runs; scores stay on the device.
