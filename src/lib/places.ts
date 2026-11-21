import maps from "./maps.json";
import states from "./states.json";

export const countries = maps;
export const usStates = states;

const popularCodes = ["US", "CA", "MX", "GB", "FR", "DE", "IT", "ES", "IN", "CN", "JP", "BR", "AU", "ID", "ZA", "EG", "NG", "AR", "KR", "NL"];

export const popularCountries = popularCodes.flatMap((code) => {
  const place = countries.find((country) => country.code === code);
  return place ? [place] : [];
});

export const otherCountries = countries
  .filter((country) => !popularCodes.includes(country.code))
  .sort((a, b) => a.name.localeCompare(b.name));

export function findPlace(id: string) {
  return countries.find((place) => place.id === id) ?? usStates.find((place) => place.id === id);
}
