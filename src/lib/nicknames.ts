import { normalizeNickname } from "./board";

export const petNames = [
  "Mochi", "Luna", "Milo", "Whiskers", "Cleo", "Nala", "Simba", "Oliver", "Loki", "Bella",
  "Shadow", "Pumpkin", "Socks", "Pepper", "Ginger", "Smokey", "Tiger", "Salem", "Binx", "Maple",
  "Pixel", "Miso", "Tuna", "Pebble", "Ziggy", "Boots", "Callie", "Jasper", "Willow", "Poppy",
  "Goose", "Biscuit", "Noodle", "Pickle", "Waffles", "Cheddar", "Muffin", "Slinky", "Ember", "Cinder",
  "Mittens", "Figaro", "Marmalade", "Soot", "Clove", "Pippin", "Jinx", "Olive", "Pounce", "Kitty",
  "Buddy", "Bailey", "Charlie", "Cooper", "Max", "Lucy", "Bear", "Duke", "Molly", "Sadie",
  "Rocky", "Tucker", "Winston", "Rosie", "Stella", "Murphy", "Hank", "Penny", "Gus", "Lola",
  "Bentley", "Maggie", "Riley", "Toby", "Dexter", "Ellie", "Scout", "Moose", "Louie", "Piper",
  "Bingo", "Rufus", "Daisy", "Coco", "Oscar", "Felix", "Theo", "Ruby", "Ivy", "Finn",
  "Hazel", "Ace", "Bramble", "Comet", "Dottie", "Fudge", "Gizmo", "Honey", "Koda", "Winnie",
];

export function generateNickname(
  suffix = Math.floor(Math.random() * 10000),
  pick = Math.random(),
): string {
  const index = Math.min(petNames.length - 1, Math.floor(pick * petNames.length));
  const digits = String(Math.abs(suffix) % 10000).padStart(4, "0");
  return `${petNames[index].toLowerCase()}${digits}`;
}

export function ensurePlayerName(
  existing: string | null,
  suffix = Math.floor(Math.random() * 10000),
  pick = Math.random(),
): string {
  const clean = normalizeNickname(existing)?.toLowerCase() ?? null;
  const pet = clean?.match(/^([a-z]+)(\d{4})$/)?.[1];
  const known = pet != null && petNames.some((name) => name.toLowerCase() === pet);
  return known && clean ? clean : generateNickname(suffix, pick);
}
