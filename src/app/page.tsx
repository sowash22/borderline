import { headers } from "next/headers";
import Game from "@/components/game";
import maps from "@/lib/maps.json";

export default async function Home() {
  const countryCode = (await headers()).get("x-vercel-ip-country")?.toUpperCase();
  // Use Vercel's approximate IP location, without a browser location prompt.
  const initialCountry = maps.find((map) => map.code === countryCode);
  return <Game initialCountryId={initialCountry?.id} />;
}
