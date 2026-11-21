import maps from "./maps.json";
import states from "./states.json";

export const countries = maps;
export const usStates = states;

export function findPlace(id: string) {
  return countries.find((place) => place.id === id) ?? usStates.find((place) => place.id === id);
}
