import fs from "node:fs";
import { feature } from "topojson-client";
import { geoMercator, geoPath, geoArea, geoCentroid, geoDistance } from "d3-geo";

const postal = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY",
};

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

const polygonFeature = (coordinates) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates } });
const atlas = JSON.parse(fs.readFileSync(new URL("../node_modules/us-atlas/states-10m.json", import.meta.url)));
const states = [];
for (const shape of feature(atlas, atlas.objects.states).features) {
  const fips = String(shape.id).padStart(2, "0");
  const code = postal[fips];
  if (!code) continue;
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
  if (!rings.length) throw new Error(`Invalid outline: ${shape.properties.name}`);
  const path = rings.map((ring) => ring.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("") + "Z").join("");
  states.push({
    id: `S${fips}`,
    name: shape.properties.name,
    code,
    flag: code,
    scope: "US state",
    path,
    rings,
  });
}
states.sort((a, b) => a.name.localeCompare(b.name, "en"));
fs.writeFileSync(new URL("../src/lib/states.json", import.meta.url), JSON.stringify(states));
console.log(`Built ${states.length} state outlines.`);
