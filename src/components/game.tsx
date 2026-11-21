"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  Globe2,
  Linkedin,
  Pencil,
  RotateCcw,
  Shuffle,
  Share2,
  Trash2,
  Trophy,
  Undo2,
} from "lucide-react";
import {
  allStates,
  countries,
  findPlace,
  otherCountries,
  otherIndianStates,
  otherUsStates,
  popularCountries,
  popularIndianStates,
  popularUsStates,
  usStates,
  indianStates,
} from "@/lib/places";
import { nicknameStorageKey, type BoardEntry, type DailyBoard } from "@/lib/board";
import { challengeLine, parseBeat } from "@/lib/challenge";
import { ensurePlayerName } from "@/lib/nicknames";
import { compareHref, drawHref, parseRoute, placeHref, playerHref, resultHref, scoresHref } from "@/lib/routes";
import DrawingBoard from "./drawing-board";
import {
  normalize,
  shapeScore,
  strokePath,
  verdict,
  type Stroke,
} from "@/lib/scoring";
import { resultImage } from "@/lib/share";

type Phase = "setup" | "drawing" | "result" | "archive" | "scores" | "compare";
type SavedMap = {
  id: string;
  countryId: string;
  countryName: string;
  flag: string;
  path: string;
  score: number;
  day: string;
  strokes: Stroke[] | null;
  reaction: number;
};
type Bests = Record<string, number>;
const storageKey = "borderline:bests:v2";
const defaultMap = countries.find((map) => map.code === "IT")!;
const places = [...countries, ...usStates, ...indianStates];

function randomPlace() {
  return places[Math.floor(Math.random() * places.length)] ?? defaultMap;
}

function daysAgo(day: string) {
  const then = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(then)) return "";
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((today - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function MapCard({
  item,
  href,
  caption,
  open,
}: {
  item: SavedMap;
  href?: string;
  caption: string;
  open?: boolean;
}) {
  const joke = open ? verdict(item.score, !item.strokes?.length, item.reaction) : null;
  const body = (
    <>
      {joke && (
        <div className="archive-story">
          <p className="archive-story-title">
            {joke.title} <span aria-hidden="true">{joke.emoji}</span>
          </p>
          <p>{joke.line}</p>
        </div>
      )}
      <div className="archive-paper">
        <div className="archive-half">
          <span className="archive-caption">{caption}</span>
          <svg viewBox="0 0 600 400" role="img" aria-label={`Drawing of ${item.countryName}`}>
            <g stroke="#6746eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {item.strokes ? normalize(item.strokes).map((stroke, index) => (
                <path key={index} d={strokePath(stroke)} />
              )) : null}
            </g>
          </svg>
          {!item.strokes && <span className="empty-result">Score only</span>}
        </div>
        <div className="archive-half archive-real">
          <span className="archive-caption">Real</span>
          <svg viewBox="0 0 600 400" role="img" aria-label={`Real outline of ${item.countryName}`}>
            <path d={item.path} fill="#e9e4fd" stroke="#6746eb" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className="archive-meta">
        <strong><PlaceMark value={item.flag} /> {item.countryName}</strong>
        <span className="archive-result">
          <b className="archive-score">{item.score}%</b>
          <span className="archive-when">{daysAgo(item.day)}</span>
        </span>
      </div>
    </>
  );
  if (open || !href) return <div className="archive-card is-open">{body}</div>;
  return <Link href={href} className="archive-card">{body}</Link>;
}

function PlaceMark({ value }: { value: string }) {
  return (
    <span className={value.length <= 3 ? "place-code" : "flag"} aria-hidden="true">
      {value}
    </span>
  );
}
function IconLabel({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof Pencil;
}) {
  return (
    <>
      <Icon size={18} aria-hidden="true" />
      {children}
    </>
  );
}

function MiniMaps({ entry }: { entry: Pick<BoardEntry, "strokes" | "path" | "countryName"> }) {
  return (
    <span className="mini-maps" aria-hidden="true">
      <svg viewBox="0 0 600 400">
        <g stroke="#6746eb" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {entry.strokes ? normalize(entry.strokes).map((stroke, index) => (
            <path key={index} d={strokePath(stroke)} />
          )) : null}
        </g>
      </svg>
      <svg viewBox="0 0 600 400">
        <path d={entry.path} fill="#e9e4fd" stroke="#6746eb" strokeWidth="8" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Standings({
  board,
  nickname,
  posting,
  preview,
}: {
  board: DailyBoard | null;
  nickname: string;
  posting: boolean;
  preview?: boolean;
}) {
  if (board && !board.configured) return null;
  const entries = board?.entries ?? [];
  const shown = preview ? entries.slice(0, 6) : entries;
  return (
    <section className="standings" aria-label="Leaderboard" aria-busy={board == null}>
      <h2>
        {preview ? (
          <Link href={scoresHref} className="standings-title">
            <Trophy size={18} aria-hidden="true" /> Leaderboard
          </Link>
        ) : (
          <>
            <Trophy size={18} aria-hidden="true" /> Leaderboard
          </>
        )}
      </h2>
      {board == null ? (
        <div aria-hidden="true">
          <div className="standing-skeleton" />
          <div className="standing-skeleton" />
          <div className="standing-skeleton" />
        </div>
      ) : shown.length ? (
        <ol className="standing-list">
          {shown.map((entry, index) => (
            <li key={entry.id}>
              <Link href={compareHref(entry.nickname, entry.id)}>
                <span className="standing-rank">{index + 1}</span>
                <span>
                  <strong>
                    {entry.nickname}
                    {entry.nickname === nickname ? " (you)" : ""}
                  </strong>
                  <span className="standing-country">{entry.countryName}</span>
                </span>
                <MiniMaps entry={entry} />
                <b>{entry.score}%</b>
                <span className="standing-open">Open</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="daily-empty">{posting ? "Saving your score…" : "No scores yet."}</p>
      )}
    </section>
  );
}

export default function Game({ initialCountryId }: { initialCountryId?: string } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const route = parseRoute(pathname);
  const [phase, setPhase] = useState<Phase>("setup");
  const [featuredId, setFeaturedId] = useState("");
  const [country, setCountry] = useState(() => (initialCountryId && findPlace(initialCountryId)) || defaultMap);
  const [roundId, setRoundId] = useState("");
  const [choice, setChoice] = useState<"featured" | "custom">("featured");
  const [customId, setCustomId] = useState("");
  const [mapsSaved, setMapsSaved] = useState<SavedMap[] | null>(null);
  const [watched, setWatched] = useState("");
  const [watchedPlace, setWatchedPlace] = useState("");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [score, setScore] = useState(0);
  const [reactionIndex, setReactionIndex] = useState(0);
  const [bests, setBests] = useState<Bests>({});
  const [newBest, setNewBest] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkFallback, setLinkFallback] = useState("");
  const [ready, setReady] = useState(false);
  const [challenge, setChallenge] = useState<{ countryId: string; score: number } | null>(null);
  const [board, setBoard] = useState<DailyBoard | null>(null);
  const [nickname, setNickname] = useState("");
  const [posting, setPosting] = useState(false);
  const view: Phase =
    route.view === "scores" ? "scores"
    : route.view === "player" ? "archive"
    : route.view === "compare" ? "compare"
    : route.view === "draw" ? "drawing"
    : route.view === "result" ? "result"
    : phase;
  const phaseRef = useRef<Phase>("setup"),
    ink = useRef<Stroke[]>([]);
  const postedRound = useRef("");
  const previousPath = useRef<string | null>(null);
  const keepFeatured = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const best = bests[country.id] ?? 0;
  const judgement = verdict(score, !strokes.length, reactionIndex);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      if (saved && typeof saved === "object")
        setBests(
          Object.fromEntries(
            Object.entries(saved).filter(
              ([key, value]) =>
                Boolean(findPlace(key)) &&
                typeof value === "number" &&
                Number.isFinite(value) &&
                value >= 0 &&
                value <= 100,
            ),
          ) as Bests,
        );
    } catch {
      /* Private browsing can disable storage. The game still works. */
    }
    const name = ensurePlayerName(localStorage.getItem(nicknameStorageKey));
    try {
      localStorage.setItem(nicknameStorageKey, name);
    } catch {
      /* The round still scores on this device. */
    }
    setNickname(name);
    setReady(true);
  }, []);
  useEffect(() => {
    const route = parseRoute(pathname);
    const beat = parseBeat(new URLSearchParams(location.search).get("beat"));
    if (route.view !== "home" && !findPlace(featuredId)) setFeaturedId(randomPlace().id);
    if (route.view === "home") {
      const linked = findPlace(new URLSearchParams(location.search).get("country") ?? "");
      if (linked) {
        router.replace(`${placeHref(linked.id)}${beat != null ? `?beat=${beat}` : ""}`);
        return;
      }
      const arriving = previousPath.current !== null && previousPath.current !== pathname;
      previousPath.current = pathname;
      let place = findPlace(featuredId);
      if (!place || (arriving && !keepFeatured.current)) {
        const next = randomPlace();
        place = next;
        setFeaturedId(next.id);
      }
      keepFeatured.current = false;
      setCountry(place);
      setChoice("featured");
      phaseRef.current = "setup";
      setPhase("setup");
      if (beat != null) setChallenge({ countryId: place.id, score: beat });
      return;
    }
    previousPath.current = pathname;
    if (route.view === "place" || route.view === "draw" || route.view === "result") {
      const place = findPlace(route.placeId);
      if (!place) {
        router.replace("/");
        return;
      }
      setCountry(place);
      setChoice("custom");
      setCustomId(place.id);
      const next = route.view === "draw" ? "drawing" : route.view === "result" ? "result" : "setup";
      phaseRef.current = next;
      setPhase(next);
      if (beat != null) setChallenge({ countryId: place.id, score: beat });
      return;
    }
    if (route.view === "scores") {
      phaseRef.current = "scores";
      setPhase("scores");
      return;
    }
    if (route.view === "player" || route.view === "compare") {
      if (watched !== route.player) setMapsSaved(null);
      setWatched(route.player);
      if (route.view === "compare") setWatchedPlace(route.placeId);
      phaseRef.current = route.view === "player" ? "archive" : "compare";
      setPhase(route.view === "player" ? "archive" : "compare");
    }
  }, [pathname, router]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  const finish = useCallback(() => {
    if (phaseRef.current !== "drawing") return;
    phaseRef.current = "result";
    const drawing = ink.current;
    const reference = country.rings.map((ring) =>
      ring.map(([x, y]) => ({ x, y })),
    );
    const result = shapeScore(drawing, reference);
    setScore(result);
    setReactionIndex(Math.floor(Math.random() * 10));
    setRoundId(crypto.randomUUID());
    setStrokes(drawing);
    setPhase("result");
    const key = country.id;
    setNewBest(result > (bests[key] ?? 0));
    const updated = { ...bests, [key]: Math.max(bests[key] ?? 0, result) };
    setBests(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      /* Best scores are optional. */
    }
    router.push(resultHref(country.id));
  }, [country, bests, router]);

  useEffect(() => {
    if (phase === "result") titleRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    let cancel = false;
    fetch("/api/scores")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: DailyBoard) => {
        if (!cancel) setBoard(data?.configured ? data : { configured: false, entries: [] });
      })
      .catch(() => {
        if (!cancel) setBoard({ configured: false, entries: [] });
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if ((view !== "archive" && view !== "compare") || !watched) return;
    let cancel = false;
    fetch(`/api/drawings?nickname=${encodeURIComponent(watched)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { drawings?: SavedMap[] }) => {
        if (!cancel) setMapsSaved(data.drawings ?? []);
      })
      .catch(() => {
        if (!cancel) setMapsSaved([]);
      });
    return () => {
      cancel = true;
    };
  }, [view, watched]);

  useEffect(() => {
    if (phase !== "result" || !nickname || !roundId) return;
    if (postedRound.current === roundId) return;
    postedRound.current = roundId;
    let cancel = false;
    setPosting(true);
    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        countryId: country.id,
        score,
        strokes: ink.current,
        reaction: reactionIndex,
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancel) return;
        if (!response.ok) {
          postedRound.current = "";
          if (response.status !== 503) setToast(data?.message ?? "Couldn’t post that score.");
          return;
        }
        if (data?.board?.configured) setBoard(data.board);
      })
      .catch(() => {
        if (cancel) return;
        postedRound.current = "";
        setToast("Couldn’t post that score.");
      })
      .finally(() => {
        if (!cancel) setPosting(false);
      });
    return () => {
      cancel = true;
    };
  }, [phase, score, nickname, country.id, roundId, reactionIndex]);

  const changeInk = (value: Stroke[]) => {
    ink.current = value;
    setStrokes(value);
  };
  const acceptInput = () => phaseRef.current === "drawing";
  const openArchive = () => {
    if (nickname) router.push(playerHref(nickname));
  };
  const start = () => {
    if (!playPlace) return;
    setCountry(playPlace);
    changeInk([]);
    setLinkFallback("");
    setToast("");
    router.push(drawHref(playPlace.id));
  };
  const reset = () => {
    router.push(placeHref(country.id));
  };
  const save = async () => {
    setBusy(true);
    try {
      const blob = await resultImage(country, strokes, score, reactionIndex);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `borderline-${country.name.toLowerCase().replaceAll(" ", "-")}-${score}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      setToast("Your masterpiece is ready to keep.");
    } catch {
      setToast("Couldn’t save the image. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    setBusy(true);
    const url = new URL(placeHref(country.id), location.origin);
    url.searchParams.set("beat", String(score));
    const text = `I drew ${country.name} and got ${score}% shape match on Borderline. Can you beat that?`;
    try {
      if (navigator.share) {
        const blob = await resultImage(country, strokes, score, reactionIndex);
        const file = new File([blob], "borderline.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] }))
          await navigator.share({
            title: "Borderline",
            text: `${text} ${url}`,
            files: [file],
          });
        else
          await navigator.share({
            title: "Borderline",
            text,
            url: String(url),
          });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setToast("Challenge copied. Send it to your most confident friend.");
      } else setLinkFallback(String(url));
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setLinkFallback(String(url));
        setToast("Copy the challenge link below.");
      }
    } finally {
      setBusy(false);
    }
  };
  const featured = findPlace(featuredId);
  const customPlace = findPlace(customId);
  const playPlace = choice === "featured" ? featured : customPlace;
  const challenged = challenge?.countryId === country.id ? challenge : null;
  const shuffle = () => {
    const currentId = playPlace?.id ?? featuredId;
    let next = randomPlace();
    for (let attempt = 0; attempt < 8 && next.id === currentId; attempt += 1) next = randomPlace();
    setFeaturedId(next.id);
    setCountry(next);
    setChoice("featured");
    setCustomId("");
    if (pathname !== "/") {
      keepFeatured.current = true;
      router.push("/");
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="wordmark"
          onClick={() => router.push("/")}
          disabled={view === "drawing"}
          aria-label="Borderline home"
        >
          <span className="brand-icon">
            <Pencil size={20} />
          </span>
          borderline<span className="brand-dot">.</span>
        </button>
        <div className="top-actions">
          <button
            className="text-button maps-link"
            onClick={openArchive}
            disabled={view === "drawing" || !nickname}
          >
            Your maps
          </button>
        </div>
      </header>

      <main>
        {view === "setup" && (
          <section className="simple-landing" aria-label="Start a drawing round">
            <div className="intro">
              <h1>
                I built this for my little one to draw maps. Then I thought: why should kids have all the fun?
              </h1>
            </div>
            <div className="home-stage">
              <div className="setup-card simple-setup">
                <p className="simple-country">Draw a map</p>
                <button
                  type="button"
                  className="day-choice today-choice"
                  aria-pressed={choice === "featured"}
                  disabled={!featured}
                  onClick={() => {
                    keepFeatured.current = true;
                    setChoice("featured");
                    if (featured) setCountry(featured);
                    router.push("/");
                  }}
                >
                  {featured && <PlaceMark value={featured.flag} />}
                  <span>
                    <strong>{featured?.name ?? "One moment…"}</strong>
                  </span>
                </button>
                <button type="button" className="text-button shuffle-button" onClick={shuffle} disabled={!featured}>
                  <IconLabel icon={Shuffle}>Choose another</IconLabel>
                </button>
                <div className="place-picks">
                  <label className="place-search" htmlFor="country-pick">
                    Country
                    <select
                      id="country-pick"
                      value={choice === "custom" && countries.some((place) => place.id === customId) ? customId : ""}
                      onChange={(event) => {
                        const place = findPlace(event.target.value);
                        if (!place) return;
                        router.push(placeHref(place.id));
                      }}
                    >
                      <option value="">Choose a country</option>
                      <optgroup label="Familiar">
                        {popularCountries.map((place) => (
                          <option key={place.id} value={place.id}>{place.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="All countries">
                        {otherCountries.map((place) => (
                          <option key={place.id} value={place.id}>{place.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </label>
                  <label className="place-search" htmlFor="state-pick">
                    State
                    <select
                      id="state-pick"
                      value={choice === "custom" && allStates.some((place) => place.id === customId) ? customId : ""}
                      onChange={(event) => {
                        const place = findPlace(event.target.value);
                        if (!place) return;
                        router.push(placeHref(place.id));
                      }}
                    >
                      <option value="">Choose a state</option>
                      <optgroup label="Familiar US">
                        {popularUsStates.map((place) => (
                          <option key={place.id} value={place.id}>{place.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Familiar India">
                        {popularIndianStates.map((place) => (
                          <option key={place.id} value={place.id}>{place.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="More US states">
                        {otherUsStates.map((place) => (
                          <option key={place.id} value={place.id}>{place.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="More Indian states">
                        {otherIndianStates.map((place) => (
                          <option key={place.id} value={place.id}>{place.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </label>
                </div>
                {challenged && <p className="setup-note">Beat {challenged.score}%.</p>}
                <button className="primary start-button" onClick={start} disabled={!ready || !playPlace}>
                  <IconLabel icon={Pencil}>{playPlace ? `Draw ${playPlace.name}` : "One moment…"}</IconLabel>
                </button>
              </div>
              <Standings board={board} nickname={nickname} posting={posting} preview />
            </div>
          </section>
        )}

        {view === "drawing" && (
          <section className="play-screen" aria-label="Drawing round">
            <div className="play-heading">
              <div>
                <h1>
                  Draw {country.name}{" "}
                  <PlaceMark value={country.flag} />
                </h1>
              </div>
            </div>
            <div className="board-card active-board">
              <div className="drawing-toolbar">
                <div>
                  <button
                    className="tool-button"
                    disabled={!strokes.length}
                    onClick={() => changeInk(strokes.slice(0, -1))}
                  >
                    <IconLabel icon={Undo2}>Undo</IconLabel>
                  </button>
                  <button
                    className="tool-button"
                    disabled={!strokes.length}
                    onClick={() => changeInk([])}
                  >
                    <IconLabel icon={Trash2}>Clear</IconLabel>
                  </button>
                </div>
                <button className="primary reveal-button" onClick={finish}>
                  <IconLabel icon={Check}>Reveal my map</IconLabel>
                </button>
              </div>
              <DrawingBoard
                strokes={strokes}
                onChange={changeInk}
                onPreview={(value) => {
                  ink.current = value;
                }}
                active
                acceptInput={acceptInput}
              />
            </div>
            <p className="playing-note">
              {challenged ? `Beat ${challenged.score}%. ` : ""}
              {country.scope === "Contiguous United States" ? "Draw the contiguous 48 states with your finger, mouse, or stylus." : "Draw with your finger, mouse, or stylus."}
            </p>
          </section>
        )}

        {view === "result" && (
          <section className="result-screen" aria-label="Round results">
            <div className="result-heading">
              <span className="eyebrow">THE MOMENT OF TRUTH</span>
              <h1 ref={titleRef} tabIndex={-1}>
                {judgement.title}{" "}
                <span aria-hidden="true">{judgement.emoji}</span>
              </h1>
              <p>{judgement.line}</p>
            </div>
            <div className="result-grid">
              <div className="result-map">
                <div className="result-map-top">
                  <span className="map-label purple">
                    <Pencil size={16} /> YOUR MASTERPIECE
                  </span>
                </div>
                <div className="result-paper">
                  <svg
                    viewBox="0 0 600 400"
                    role="img"
                    aria-label={`Your drawing of ${country.name}`}
                  >
                    <g
                      stroke="#6746eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    >
                      {normalize(strokes).map((stroke, i) => (
                        <path key={i} d={strokePath(stroke)} />
                      ))}
                    </g>
                  </svg>
                  {!strokes.length && (
                    <span className="empty-result">
                      An impressive amount of nothing.
                    </span>
                  )}
                </div>
                <div className="map-footer">
                  <PlaceMark value={country.flag} /> {country.name}, apparently.
                </div>
              </div>
              <div className="result-map">
                <div className="result-map-top">
                  <span className="map-label">
                    <Globe2 size={16} /> THE ACTUAL COUNTRY
                  </span>
                  <span>REALITY</span>
                </div>
                <div className="result-paper real-map">
                  <svg
                    viewBox="0 0 600 400"
                    role="img"
                    aria-label={`Simplified real outline of ${country.name}`}
                  >
                    <path
                      d={country.path}
                      fill="#e9e4fd"
                      stroke="#6746eb"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="map-footer">
                  <PlaceMark value={country.flag} /> {country.scope === "Contiguous United States" ? country.scope : country.name}, geographically.
                </div>
              </div>
            </div>
            <div className="score-bar">
              <div className="score-main">
                <div className="score-number">
                  {score}
                  <span>%</span>
                </div>
                <div>
                  <strong>Shape match</strong>
                  <span>
                    {score >= 65
                      ? "Your geography teacher would be proud."
                      : "Confidence: 100%. Borders: negotiable."}
                  </span>
                </div>
              </div>
              <div className="best-score">
                <Trophy size={21} />
                <span>
                  <strong>
                    {newBest ? "New personal best!" : `Personal best: ${best}%`}
                  </strong>
                  <span>
                    {country.name}
                  </span>
                </span>
              </div>
            </div>
            {challenged && <p className="challenge-line">{challengeLine(score, challenged.score)}</p>}
            <p className="score-note">
              A playful outline comparison, adjusted for size and position. Not
              a geography exam.
            </p>
            <div className="result-actions">
              <button className="primary" onClick={start}>
                <IconLabel icon={RotateCcw}>Try {country.name} again</IconLabel>
              </button>
            </div>
            <Standings board={board} nickname={nickname} posting={posting} preview />
            <div className="share-actions">
              <button className="text-button" disabled={busy} onClick={share}>
                <IconLabel icon={Share2}>Challenge a friend</IconLabel>
              </button>
              <button className="text-button" disabled={busy} onClick={save}>
                <IconLabel icon={Download}>
                  {busy ? "One moment…" : "Save my masterpiece"}
                </IconLabel>
              </button>
            </div>
            {linkFallback && (
              <label className="fallback-link">
                Copy your challenge link
                <input
                  readOnly
                  value={linkFallback}
                  onFocus={(event) => event.target.select()}
                />
              </label>
            )}
            <button className="back-button" onClick={reset}>
              <IconLabel icon={ArrowLeft}>Back to the drawing board</IconLabel>
            </button>
          </section>
        )}

        {view === "archive" && (
          <section className="archive" aria-label="Your maps">
            <div className="archive-heading">
              <h1>{!watched || watched === nickname ? "Your maps" : `${watched}'s maps`}</h1>
              <p>{!watched || watched === nickname ? "Open one to hear what the atlas said." : "Open one to see how they remember the world."}</p>
            </div>
            {mapsSaved == null ? (
              <div className="archive-grid" aria-hidden="true">
                <div className="standing-skeleton archive-skeleton" />
                <div className="standing-skeleton archive-skeleton" />
              </div>
            ) : mapsSaved.length ? (
              <div className="archive-grid">
                {mapsSaved.map((item) => (
                  <MapCard
                    key={item.id}
                    item={item}
                    href={compareHref(watched, item.id)}
                    caption={watched === nickname ? "Yours" : "Theirs"}
                  />
                ))}
              </div>
            ) : (
              <p className="archive-empty">No drawings yet. Draw a country or a state and it will show up here.</p>
            )}
            <button className="primary archive-back" onClick={reset}>
              <IconLabel icon={Pencil}>Draw another</IconLabel>
            </button>
          </section>
        )}

        {view === "scores" && (
          <section className="archive scores-page" aria-label="Leaderboard">
            <div className="archive-heading">
              <h1>Leaderboard</h1>
            </div>
            <Standings board={board} nickname={nickname} posting={posting} />
          </section>
        )}

        {view === "compare" && (() => {
          const drawing = mapsSaved?.find((item) => item.id === watchedPlace)
            ?? mapsSaved?.find((item) => item.countryId === watchedPlace);
          const others = mapsSaved?.filter((item) => item.id !== drawing?.id) ?? [];
          const caption = watched === nickname ? "Yours" : "Theirs";
          return (
            <section className="archive" aria-label={`${watched}'s maps`}>
              <div className="archive-heading">
                <h1>{watched === nickname ? "Your maps" : `${watched}'s maps`}</h1>
                <p>{watched === nickname ? "This one is open. The rest of your atlas is below." : "This is the drawing you opened. The rest of their atlas is below."}</p>
              </div>
              {mapsSaved == null ? (
                <div className="archive-grid" aria-hidden="true">
                  <div className="standing-skeleton archive-skeleton" />
                  <div className="standing-skeleton archive-skeleton" />
                </div>
              ) : drawing ? (
                <>
                  <div className="archive-picked">
                    <MapCard item={drawing} caption={caption} open />
                  </div>
                  {others.length > 0 && (
                    <div className="archive-more">
                      <Link className="more-from" href={playerHref(watched)}>
                        {watched === nickname ? "See more from you" : `See more from ${watched}`}
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <p className="archive-empty">No drawing stored for this attempt.</p>
              )}
            </section>
          );
        })()}
      </main>
      <footer className="compact-footer">
        <nav className="creator-footer" aria-label="Creator links">
          <a className="creator-name" href="https://www.linkedin.com/in/sowndarya-shanmugam/" target="_blank" rel="noopener noreferrer">
            Soundarya <span>Sanmugam</span>
          </a>
          <a className="creator-social" href="https://www.linkedin.com/in/sowndarya-shanmugam/" target="_blank" rel="noopener noreferrer" aria-label="Soundarya Sanmugam on LinkedIn" title="LinkedIn">
            <Linkedin size={18} aria-hidden="true" />
          </a>
        </nav>
      </footer>
      <div className="toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
    </div>
  );
}
