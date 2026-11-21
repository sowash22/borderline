import maps from "./maps.json";
import india from "./india-states.json";
import states from "./states.json";

export const countries = maps;
export const usStates = states;
export const indianStates = india;
export const allStates = [...usStates, ...indianStates];

const popularCodes = ["US", "CA", "MX", "GB", "FR", "DE", "IT", "ES", "IN", "CN", "JP", "BR", "AU", "ID", "ZA", "EG", "NG", "AR", "KR", "NL"];
const popularUsCodes = ["CA", "TX", "NY", "FL", "AK", "HI", "WA", "MI", "CO", "IL", "MA", "AZ", "NV", "PA", "GA"];
const popularIndiaCodes = ["TN", "MH", "KA", "KL", "GJ", "RJ", "UP", "WB", "PB", "DL", "TG", "AP"];

export const popularCountries = popularCodes.flatMap((code) => {
  const place = countries.find((country) => country.code === code);
  return place ? [place] : [];
});

export const otherCountries = countries
  .filter((country) => !popularCodes.includes(country.code))
  .sort((a, b) => a.name.localeCompare(b.name));

function pickByCode<T extends { code: string; name: string }>(places: T[], codes: string[]) {
  return codes.flatMap((code) => {
    const place = places.find((item) => item.code === code);
    return place ? [place] : [];
  });
}

export const popularUsStates = pickByCode(usStates, popularUsCodes);
export const popularIndianStates = pickByCode(indianStates, popularIndiaCodes);
export const otherUsStates = usStates.filter((place) => !popularUsCodes.includes(place.code));
export const otherIndianStates = indianStates.filter((place) => !popularIndiaCodes.includes(place.code));

export function findPlace(id: string) {
  return countries.find((place) => place.id === id)
    ?? usStates.find((place) => place.id === id)
    ?? indianStates.find((place) => place.id === id);
}
