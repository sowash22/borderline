export type GameRoute =
  | { view: "home" }
  | { view: "scores" }
  | { view: "place" | "draw" | "result"; placeId: string }
  | { view: "player"; player: string }
  | { view: "compare"; player: string; placeId: string };

export function parseRoute(pathname: string): GameRoute {
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "scores") return { view: "scores" };
  if (parts[0] === "player" && parts[1] && parts[2]) {
    return { view: "compare", player: parts[1], placeId: parts[2] };
  }
  if (parts[0] === "player" && parts[1]) return { view: "player", player: parts[1] };
  if (parts[0] === "place" && parts[1] && parts[2] === "draw") return { view: "draw", placeId: parts[1] };
  if (parts[0] === "place" && parts[1] && parts[2] === "result") return { view: "result", placeId: parts[1] };
  if (parts[0] === "place" && parts[1]) return { view: "place", placeId: parts[1] };
  return { view: "home" };
}

export const placeHref = (id: string) => `/place/${id}`;
export const drawHref = (id: string) => `/place/${id}/draw`;
export const resultHref = (id: string) => `/place/${id}/result`;
export const playerHref = (nickname: string) => `/player/${encodeURIComponent(nickname)}`;
export const compareHref = (nickname: string, placeId: string) =>
  `/player/${encodeURIComponent(nickname)}/${placeId}`;
