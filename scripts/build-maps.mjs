import fs from "node:fs";
import { feature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";
const atlas = JSON.parse(
  fs.readFileSync(
    new URL("../node_modules/world-atlas/countries-110m.json", import.meta.url),
  ),
);
const features = feature(atlas, atlas.objects.countries).features;
const picks = [
  ["380", "Italy", "🇮🇹", "Starter", "The boot. You know the boot."],
  [
    "036",
    "Australia",
    "🇦🇺",
    "Starter",
    "A continent with main-character energy.",
  ],
  [
    "250",
    "France",
    "🇫🇷",
    "Starter",
    "Somewhere between a hexagon and a croissant.",
  ],
  [
    "356",
    "India",
    "🇮🇳",
    "Medium",
    "A familiar shape. Until you have to draw it.",
  ],
  ["392", "Japan", "🇯🇵", "Spicy", "A few islands. A lot of confidence."],
  [
    "076",
    "Brazil",
    "🇧🇷",
    "Medium",
    "Big country. Bigger room for interpretation.",
  ],
  [
    "818",
    "Egypt",
    "🇪🇬",
    "Starter",
    "Your time to shine, rectangle enthusiasts.",
  ],
  [
    "276",
    "Germany",
    "🇩🇪",
    "Medium",
    "Precision is optional. Enthusiasm is not.",
  ],
  [
    "724",
    "Spain",
    "🇪🇸",
    "Starter",
    "The Iberian Peninsula remembers everything.",
  ],
  ["484", "Mexico", "🇲🇽", "Medium", "Do not forget the very long peninsula."],
  [
    "826",
    "United Kingdom",
    "🇬🇧",
    "Spicy",
    "A lot of coastline for a little island.",
  ],
  [
    "710",
    "South Africa",
    "🇿🇦",
    "Medium",
    "Give the bottom of Africa your best shot.",
  ],
  [
    "032",
    "Argentina",
    "🇦🇷",
    "Medium",
    "Think long. Then think a little longer.",
  ],
  [
    "554",
    "New Zealand",
    "🇳🇿",
    "Spicy",
    "Two islands. Zero pressure. Okay, some pressure.",
  ],
  ["752", "Sweden", "🇸🇪", "Medium", "Tall country. Short timer."],
  [
    "410",
    "South Korea",
    "🇰🇷",
    "Medium",
    "Small on the globe. Big on the blank page.",
  ],
  ["300", "Greece", "🇬🇷", "Spicy", "The coastline has chosen chaos."],
  [
    "620",
    "Portugal",
    "🇵🇹",
    "Starter",
    "Spain’s very stylish next-door neighbor.",
  ],
];
const area = (ring) =>
  Math.abs(
    ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0),
  );
const maps = picks.map(([id, name, flag, difficulty, note]) => {
  const f = features.find((f) => String(f.id).padStart(3, "0") === id);
  let polygons =
    f.geometry.type === "Polygon"
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
  // Keep the largest landmass and substantial islands. Omit distant overseas territories.
  const largest = polygons.reduce((a, b) => (area(a[0]) > area(b[0]) ? a : b));
  const center = largest[0].reduce(
    (s, p) => [
      s[0] + p[0] / largest[0].length,
      s[1] + p[1] / largest[0].length,
    ],
    [0, 0],
  );
  polygons = polygons.filter(
    (poly) =>
      area(poly[0]) >= area(largest[0]) * 0.007 &&
      poly[0].some(
        (p) =>
          Math.abs(p[0] - center[0]) < 25 && Math.abs(p[1] - center[1]) < 25,
      ),
  );
  const shape = {
    type: "Feature",
    properties: {},
    geometry: { type: "MultiPolygon", coordinates: polygons },
  };
  const projection = geoMercator().fitExtent(
    [
      [65, 40],
      [535, 360],
    ],
    shape,
  );
  const path = geoPath(projection).digits(2)(shape);
  const rings = polygons.map((poly) =>
    poly[0].map((p) => projection(p).map((n) => Math.round(n * 100) / 100)),
  );
  return { id, name, flag, difficulty, note, path, rings };
});
fs.writeFileSync(
  new URL("../src/lib/maps.json", import.meta.url),
  JSON.stringify(maps),
);
console.log(`Built ${maps.length} simplified Natural Earth outlines.`);
