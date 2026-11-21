import fs from "node:fs";

function close(points) {
  const first = points[0];
  const last = points.at(-1);
  if (first[0] !== last[0] || first[1] !== last[1]) points.push(first);
  return points.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
}

function ellipse(cx, cy, rx, ry, steps = 36) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (Math.PI * 2 * i) / steps - Math.PI / 2;
    points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  return close(points);
}

function polygon(points) {
  return close(points);
}

function pathFrom(rings) {
  return rings.map((ring) => ring.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("") + "Z").join("");
}

function shape(id, name, flag, kind, rings) {
  return { id, name, flag, code: id, kind, scope: kind, path: pathFrom(rings), rings };
}

const animals = [
  shape("A-cat", "Cat", "🐱", "animal", [
    polygon([
      [210, 92], [248, 58], [262, 118], [338, 118], [352, 58], [390, 92],
      [418, 168], [402, 236], [338, 278], [262, 278], [198, 236], [182, 168],
    ]),
    ellipse(248, 168, 10, 12, 16),
    ellipse(352, 168, 10, 12, 16),
  ]),
  shape("A-dog", "Dog", "🐶", "animal", [
    polygon([
      [176, 96], [214, 70], [236, 112], [364, 112], [386, 70], [424, 96],
      [448, 176], [418, 250], [338, 292], [262, 292], [182, 250], [152, 176],
    ]),
  ]),
  shape("A-fish", "Fish", "🐟", "animal", [
    polygon([
      [150, 200], [214, 132], [330, 118], [430, 168], [478, 140], [478, 260],
      [430, 232], [330, 282], [214, 268],
    ]),
  ]),
  shape("A-bird", "Bird", "🐦", "animal", [
    polygon([
      [150, 210], [214, 150], [280, 118], [348, 132], [402, 176], [450, 150],
      [430, 214], [370, 260], [278, 278], [196, 254],
    ]),
  ]),
  shape("A-rabbit", "Rabbit", "🐰", "animal", [
    polygon([
      [236, 58], [258, 58], [274, 148], [326, 148], [342, 58], [364, 58],
      [382, 150], [410, 214], [382, 278], [218, 278], [190, 214], [218, 150],
    ]),
  ]),
  shape("A-elephant", "Elephant", "🐘", "animal", [
    polygon([
      [150, 168], [210, 118], [330, 110], [410, 150], [450, 210], [430, 278],
      [370, 300], [250, 300], [190, 278], [150, 230], [178, 210],
    ]),
  ]),
];

const objects = [
  shape("O-heart", "Heart", "❤", "object", [
    polygon([
      [300, 318], [168, 186], [168, 132], [214, 86], [268, 86], [300, 128],
      [332, 86], [386, 86], [432, 132], [432, 186],
    ]),
  ]),
  shape("O-star", "Star", "⭐", "object", [
    polygon([
      [300, 70], [332, 168], [436, 168], [352, 226], [384, 324],
      [300, 268], [216, 324], [248, 226], [164, 168], [268, 168],
    ]),
  ]),
  shape("O-house", "House", "🏠", "object", [
    polygon([
      [300, 70], [470, 186], [430, 186], [430, 318], [170, 318], [170, 186], [130, 186],
    ]),
  ]),
  shape("O-car", "Car", "🚗", "object", [
    polygon([
      [120, 214], [170, 214], [210, 150], [390, 150], [450, 214], [480, 214],
      [480, 268], [120, 268],
    ]),
    ellipse(200, 268, 28, 28, 20),
    ellipse(400, 268, 28, 28, 20),
  ]),
  shape("O-cup", "Cup", "☕", "object", [
    polygon([
      [190, 110], [390, 110], [370, 290], [210, 290],
    ]),
    polygon([
      [390, 140], [450, 140], [450, 230], [390, 230],
    ]),
  ]),
  shape("O-tree", "Tree", "🌳", "object", [
    ellipse(300, 168, 110, 96, 28),
    polygon([
      [278, 230], [322, 230], [322, 330], [278, 330],
    ]),
  ]),
];

const fruits = [
  shape("F-apple", "Apple", "🍎", "fruit", [
    ellipse(300, 210, 92, 102, 32),
    polygon([[300, 92], [318, 58], [342, 78], [312, 108]]),
  ]),
  shape("F-banana", "Banana", "🍌", "fruit", [
    polygon([
      [140, 250], [180, 170], [270, 118], [380, 110], [470, 150],
      [430, 186], [340, 168], [250, 196], [190, 250],
    ]),
  ]),
  shape("F-pear", "Pear", "🍐", "fruit", [
    polygon([
      [300, 70], [338, 118], [360, 176], [370, 250], [338, 318],
      [262, 318], [230, 250], [240, 176], [262, 118],
    ]),
  ]),
  shape("F-grape", "Grape", "🍇", "fruit", [
    ellipse(270, 168, 38, 38, 18),
    ellipse(330, 168, 38, 38, 18),
    ellipse(246, 222, 36, 36, 18),
    ellipse(300, 230, 40, 40, 18),
    ellipse(354, 222, 36, 36, 18),
    ellipse(276, 278, 34, 34, 18),
    ellipse(324, 278, 34, 34, 18),
  ]),
  shape("F-lemon", "Lemon", "🍋", "fruit", [
    ellipse(300, 200, 118, 78, 32),
  ]),
  shape("F-strawberry", "Strawberry", "🍓", "fruit", [
    polygon([
      [300, 330], [198, 230], [198, 150], [248, 102], [352, 102], [402, 150], [402, 230],
    ]),
  ]),
];

const basics = [
  shape("X-circle", "Circle", "○", "shape", [ellipse(300, 200, 110, 110, 36)]),
  shape("X-square", "Square", "□", "shape", [
    polygon([[190, 90], [410, 90], [410, 310], [190, 310]]),
  ]),
  shape("X-triangle", "Triangle", "△", "shape", [
    polygon([[300, 80], [460, 320], [140, 320]]),
  ]),
  shape("X-diamond", "Diamond", "◇", "shape", [
    polygon([[300, 70], [450, 200], [300, 330], [150, 200]]),
  ]),
  shape("X-crescent", "Crescent", "🌙", "shape", [
    ellipse(300, 200, 110, 110, 36),
    ellipse(340, 186, 82, 82, 28),
  ]),
  shape("X-cloud", "Cloud", "☁", "shape", [
    ellipse(240, 210, 70, 52, 24),
    ellipse(300, 176, 78, 62, 24),
    ellipse(364, 210, 72, 52, 24),
    polygon([[180, 210], [420, 210], [420, 262], [180, 262]]),
  ]),
];

const shapes = [...animals, ...objects, ...fruits, ...basics];
for (const item of shapes) {
  for (const ring of item.rings) {
    if (ring.length < 4) throw new Error(`Too small: ${item.name}`);
    for (const [x, y] of ring) {
      if (x < 64 || x > 536 || y < 39 || y > 361) throw new Error(`${item.name}: ${x},${y}`);
    }
  }
}

fs.writeFileSync(new URL("../src/lib/shapes.json", import.meta.url), JSON.stringify(shapes));
console.log(`Built ${shapes.length} extra outlines.`);
