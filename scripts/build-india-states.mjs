import fs from "node:fs";
import { geoMercator, geoPath, geoArea, geoCentroid, geoDistance } from "d3-geo";

const sourceUrl = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson";
const skip = new Set([
  "Andaman and Nicobar",
  "Chandigarh",
  "Dadra and Nagar Haveli",
  "Daman and Diu",
  "Lakshadweep",
  "Puducherry",
]);
const names = {
  Orissa: "Odisha",
  Uttaranchal: "Uttarakhand",
};
const postal = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CT",
  Delhi: "DL",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  "Jammu and Kashmir": "JK",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Orissa: "OR",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TG",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttaranchal: "UT",
  "West Bengal": "WB",
};

function simplify(points, tolerance = 2) {
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

const polygonFeature = (coordinates) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates } });

const local = process.env.INDIA_GEOJSON;
const atlas = JSON.parse(local
  ? fs.readFileSync(local, "utf8")
  : await fetch(sourceUrl).then((response) => {
      if (!response.ok) throw new Error(`Could not download Indian states: ${response.status}`);
      return response.text();
    }));

const states = [];
for (const shape of atlas.features) {
  const sourceName = shape.properties?.NAME_1;
  const code = postal[sourceName];
  if (!code || skip.has(sourceName)) continue;
  let polygons = shape.geometry.type === "Polygon" ? [shape.geometry.coordinates] : shape.geometry.coordinates;
  const largest = polygons.reduce((a, b) => geoArea(polygonFeature(a)) > geoArea(polygonFeature(b)) ? a : b);
  const center = geoCentroid(polygonFeature(largest));
  const largestArea = geoArea(polygonFeature(largest));
  polygons = polygons.filter((poly) => poly === largest || (
    geoArea(polygonFeature(poly)) >= largestArea * 0.02 &&
    geoDistance(center, geoCentroid(polygonFeature(poly))) < Math.PI / 8
  ));
  const outline = { type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: polygons.map((poly) => [poly[0]]) } };
  const projection = geoMercator().rotate([-center[0], 0]);
  projection.fitExtent([[65, 40], [535, 360]], outline);
  const projected = [];
  let current;
  const context = {
    moveTo(x, y) { current = [[x, y]]; projected.push(current); },
    lineTo(x, y) { current.push([x, y]); },
    closePath() { if (current.length) current.push(current[0]); },
  };
  geoPath(projection).context(context)(outline);
  const rings = projected.filter((ring) => ring.length >= 4).map((ring) => {
    const simple = simplify(ring);
    return (simple.length >= 4 ? simple : ring).map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
  });
  const name = names[sourceName] ?? sourceName;
  if (!rings.length) throw new Error(`Invalid outline: ${name}`);
  const path = rings.map((ring) => ring.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("") + "Z").join("");
  states.push({
    id: `I-${code}`,
    name,
    code,
    flag: code,
    scope: "Indian state",
    path,
    rings,
  });
}
states.sort((a, b) => a.name.localeCompare(b.name, "en"));
if (states.length < 28) throw new Error(`Expected Indian states, got ${states.length}`);
fs.writeFileSync(new URL("../src/lib/india-states.json", import.meta.url), JSON.stringify(states));
console.log(`Built ${states.length} Indian state outlines.`);
