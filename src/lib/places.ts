import maps from "./maps.json";
import states from "./states.json";
import extras from "./shapes.json";

export type PlaceKind = "country" | "state" | "animal" | "object" | "fruit" | "shape";

export type Place = {
  id: string;
  name: string;
  flag: string;
  code: string;
  kind: PlaceKind;
  scope?: string;
  path: string;
  rings: number[][][];
};

export const countries: Place[] = (maps as Omit<Place, "kind">[]).map((place) => ({ ...place, kind: "country" }));
export const usStates: Place[] = (states as Omit<Place, "kind">[]).map((place) => ({ ...place, kind: "state" }));
export const extraShapes: Place[] = extras as Place[];
export const animals = extraShapes.filter((place) => place.kind === "animal");
export const objects = extraShapes.filter((place) => place.kind === "object");
export const fruits = extraShapes.filter((place) => place.kind === "fruit");
export const basics = extraShapes.filter((place) => place.kind === "shape");
export const allPlaces: Place[] = [...countries, ...usStates, ...extraShapes];

const popularCodes = ["US", "CA", "MX", "GB", "FR", "DE", "IT", "ES", "IN", "CN", "JP", "BR", "AU", "ID", "ZA", "EG", "NG", "AR", "KR", "NL"];

export const popularCountries = popularCodes.flatMap((code) => {
  const place = countries.find((country) => country.code === code);
  return place ? [place] : [];
});

export const otherCountries = countries
  .filter((country) => !popularCodes.includes(country.code))
  .sort((a, b) => a.name.localeCompare(b.name));

export const categories = [
  { id: "country", label: "Countries", prompt: "a country", items: countries },
  { id: "state", label: "US states", prompt: "a state", items: usStates },
  { id: "animal", label: "Animals", prompt: "an animal", items: animals },
  { id: "object", label: "Objects", prompt: "an object", items: objects },
  { id: "fruit", label: "Fruits", prompt: "a fruit", items: fruits },
  { id: "shape", label: "Shapes", prompt: "a shape", items: basics },
] as const;

export function findPlace(id: string) {
  return allPlaces.find((place) => place.id === id);
}

export function subjectFor(place?: { kind?: string } | null) {
  if (place?.kind === "animal") return "animal";
  if (place?.kind === "object") return "object";
  if (place?.kind === "fruit") return "fruit";
  if (place?.kind === "shape") return "shape";
  if (place?.kind === "state") return "state";
  return "country";
}
