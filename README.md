# Borderline

A mobile-friendly geography drawing game built with Next.js App Router, React, and TypeScript. Pick a country, draw its outline at your own pace, then compare your drawing with the real map.

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

## Phase one

- 238 countries and territories with simplified Natural Earth outlines.
- Finger, mouse, and stylus drawing; undo and clear.
- Untimed drawing, with manual reveal whenever you’re ready.
- Side-by-side reveal and deterministic, playful shape similarity.
- Quick replay and recent-country avoidance.
- Device-local personal bests, a downloadable PNG, and friend challenge links.
- Responsive design, reduced motion, keyboard-accessible controls.
- No accounts, databases, API keys, paid AI calls, or public uploads.

Scores use symmetric sampled outline distance with translation and uniform scale normalization. They preserve aspect ratio and orientation. This is a playful heuristic, not a validated geographic accuracy measure. The short verdicts are authored text, not AI-generated.

Best scores are kept in local storage on the current device. Drawings are only exported or shared when the player chooses to do so. Nothing is automatically published.

## Vercel

Import this repository in Vercel. The framework is Next.js, the build command is `npm run build`, and the root is the repository root. No environment variables are required.

## Map data

Outlines are generated from `world-atlas` 2.0.2 (110m, 50m, and 10m atlases), which contains public-domain Natural Earth data. Run `npm run maps` to regenerate the bundled map geometry. Small islands and distant overseas territories are omitted to keep the game playable; France uses its European mainland and nearby islands. The US uses the contiguous 48 states, labeled in the game. Country detection uses Vercel’s IP country code; shared country links take priority. Maps are game references, not authoritative boundary records.

Sources: https://github.com/topojson/world-atlas and https://www.naturalearthdata.com/about/terms-of-use/

## Phase two

AI commentary and an opt-in public wall of fame/shame are intentionally deferred. They need a server-side AI integration, persistent storage, abuse controls, and clear publication consent.
