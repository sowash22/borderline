import { headers } from "next/headers";
import Game from "@/components/game";
import maps from "@/lib/maps.json";

export default async function Home() {
  const countryCode = (await headers()).get("x-vercel-ip-country")?.toUpperCase();
  // Use Vercel's approximate IP location, without a browser location prompt.
  const flag = countryCode && /^[A-Z]{2}$/.test(countryCode)
    ? String.fromCodePoint(...Array.from(countryCode, (letter) => letter.charCodeAt(0) + 127397))
    : null;
  const initialCountry = maps.find((map) => map.flag === flag);
  return <Game initialCountryId={initialCountry?.id} />;
}
