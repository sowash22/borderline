import fs from "node:fs";
import { feature } from "topojson-client";
import { geoMercator, geoAzimuthalEqualArea, geoPath, geoArea, geoCentroid, geoDistance } from "d3-geo";
import { iso31661 } from "iso-3166";

// Prefer simple outlines; use more detailed atlases for small countries and islands.
const byId = new Map();
const detailedById = new Map();
const mediumById = new Map();
for (const detail of ["110m", "50m", "10m"]) {
  const atlas = JSON.parse(fs.readFileSync(new URL(`../node_modules/world-atlas/countries-${detail}.json`, import.meta.url)));
  for (const f of feature(atlas, atlas.objects.countries).features) {
    if (detail === "50m" && f.id) mediumById.set(String(f.id).padStart(3, "0"), f);
    if (detail === "10m" && f.id) detailedById.set(String(f.id).padStart(3, "0"), f);
    if (f.id && !byId.has(String(f.id).padStart(3, "0"))) byId.set(String(f.id).padStart(3, "0"), f);
  }
}
const names = new Intl.DisplayNames(["en"], { type: "region" });
const polygonFeature = (coordinates) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates } });

// Simplify after projection so every country's detail fits the same drawing surface.
function simplify(points, tolerance = 0.8) {
  if (points.length <= 4) return points;
  const first = points[0], last = points.at(-1);
  let maximum = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], dx = last[0] - first[0], dy = last[1] - first[1];
    const t = Math.max(0, Math.min(1, ((p[0] - first[0]) * dx + (p[1] - first[1]) * dy) / (dx * dx + dy * dy || 1)));
    const distance = Math.hypot(p[0] - first[0] - t * dx, p[1] - first[1] - t * dy);
    if (distance > maximum) { maximum = distance; index = i; }
  }
  return maximum > tolerance
    ? [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)]
    : [first, last];
}
const maps = [];
for (const entry of iso31661) {
  let f = byId.get(entry.numeric);
  if (!f) continue;
  if (geoArea(f) < 0.0025 && mediumById.has(entry.numeric)) f = mediumById.get(entry.numeric);
  if (geoArea(f) < 0.0001 && detailedById.has(entry.numeric)) f = detailedById.get(entry.numeric);
  let polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const largest = polygons.reduce((a, b) => geoArea(polygonFeature(a)) > geoArea(polygonFeature(b)) ? a : b);
  const center = geoCentroid(polygonFeature(largest));
  const largestArea = geoArea(polygonFeature(largest));
  // Keep the recognizable main outline and nearby islands, rather than distant territories.
  polygons = entry.alpha2 === "US" ? [largest] : polygons.filter((poly) => poly === largest || (
    geoArea(polygonFeature(poly)) >= largestArea * 0.001 &&
    geoDistance(center, geoCentroid(polygonFeature(poly))) < Math.PI / 4
  ));
  const shape = { type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: polygons.map(poly => [poly[0]]) } };
  const projection = entry.alpha2 === "AQ"
    ? geoAzimuthalEqualArea().rotate([0, 90])
    : geoMercator().rotate([-center[0], 0]);
  projection.fitExtent([[65, 40], [535, 360]], shape);
  // Capture the projected path so rendered borders and score geometry use identical clipping.
  const projected = []; let current;
  const context = {
    moveTo(x, y) { current = [[x, y]]; projected.push(current); },
    lineTo(x, y) { current.push([x, y]); },
    closePath() { if (current.length) current.push(current[0]); },
  };
  geoPath(projection).context(context)(shape);
  const rings = projected.filter(ring => ring.length >= 4).map(ring => {
    const simple = simplify(ring);
    return (simple.length >= 4 ? simple : ring).map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
  });
  if (!rings.length || !rings.flat().every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) throw new Error(`Invalid outline: ${entry.alpha2}`);
  const path = rings.map(ring => ring.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("") + "Z").join("");
  maps.push({ id: entry.numeric, name: names.of(entry.alpha2), code: entry.alpha2,
    flag: String.fromCodePoint(...Array.from(entry.alpha2, letter => letter.charCodeAt(0) + 127397)),
    scope: entry.alpha2 === "US" ? "Contiguous United States" : "", path, rings });
}
maps.sort((a, b) => a.name.localeCompare(b.name, "en"));
fs.writeFileSync(new URL("../src/lib/maps.json", import.meta.url), JSON.stringify(maps));
console.log(`Built ${maps.length} simplified country and territory outlines (${fs.statSync(new URL("../src/lib/maps.json", import.meta.url)).size} bytes).`);
console.log("Missing from source atlases:", iso31661.filter(entry => !byId.has(entry.numeric)).map(entry => names.of(entry.alpha2)).join(", "));
