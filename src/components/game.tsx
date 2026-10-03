"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Download,
  Globe2,
  HelpCircle,
  Pencil,
  RotateCcw,
  Share2,
  Shuffle,
  Sparkles,
  Trash2,
  Trophy,
  Undo2,
  X,
} from "lucide-react";
import maps from "@/lib/maps.json";
import DrawingBoard from "./drawing-board";
import {
  normalize,
  shapeScore,
  strokePath,
  verdict,
  type Stroke,
} from "@/lib/scoring";
import { resultImage } from "@/lib/share";

type Phase = "setup" | "drawing" | "result";
type Bests = Record<string, number>;
const storageKey = "borderline:bests:v1";
const defaultMap = maps[0];
function dailyMap() {
  const stamp = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (const char of stamp) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return maps[hash % maps.length];
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

export default function Game() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [country, setCountry] = useState(defaultMap);
  const [seconds, setSeconds] = useState(30);
  const [remaining, setRemaining] = useState(30);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [score, setScore] = useState(0);
  const [bests, setBests] = useState<Bests>({});
  const [newBest, setNewBest] = useState(false);
  const [daily, setDaily] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkFallback, setLinkFallback] = useState("");
  const [ready, setReady] = useState(false);
  const deadline = useRef(0),
    phaseRef = useRef<Phase>("setup"),
    ink = useRef<Stroke[]>([]);
  const recent = useRef<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null),
    titleRef = useRef<HTMLHeadingElement>(null);
  const best = bests[`${country.id}:${seconds}`] ?? 0;
  const judgement = verdict(score, !strokes.length);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      if (saved && typeof saved === "object")
        setBests(
          Object.fromEntries(
            Object.entries(saved).filter(
              ([key, value]) =>
                /^\d{3}:(30|60)$/.test(key) &&
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
    const params = new URLSearchParams(location.search);
    const chosen = maps.find((map) => map.id === params.get("country"));
    if (chosen) {
      setCountry(chosen);
      setSeconds(params.get("time") === "60" ? 60 : 30);
      setToast("Friend challenge loaded. Your turn!");
    }
    setReady(true);
  }, []);
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
    setStrokes(drawing);
    setPhase("result");
    setRounds((value) => value + 1);
    const key = `${country.id}:${seconds}`;
    setNewBest(result > (bests[key] ?? 0));
    const updated = { ...bests, [key]: Math.max(bests[key] ?? 0, result) };
    setBests(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      /* Best scores are optional. */
    }
  }, [country, seconds, bests]);

  useEffect(() => {
    if (phase !== "drawing") return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left === 0) finish();
    };
    tick();
    const id = setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [phase, finish]);
  useEffect(() => {
    if (phase === "result") titleRef.current?.focus();
  }, [phase]);

  const changeInk = (value: Stroke[]) => {
    ink.current = value;
    setStrokes(value);
  };
  const acceptInput = () => {
    if (phaseRef.current !== "drawing") return false;
    if (Date.now() >= deadline.current) {
      finish();
      return false;
    }
    return true;
  };
  const start = () => {
    changeInk([]);
    setRemaining(seconds);
    deadline.current = Date.now() + seconds * 1000;
    phaseRef.current = "drawing";
    setPhase("drawing");
    setLinkFallback("");
    setToast("");
  };
  const reset = () => {
    phaseRef.current = "setup";
    setPhase("setup");
    changeInk([]);
    setLinkFallback("");
  };
  const randomCountry = () => {
    recent.current = [...recent.current, country.id].slice(-5);
    const choices = maps.filter((map) => !recent.current.includes(map.id));
    setCountry(choices[Math.floor(Math.random() * choices.length)]);
    setDaily(false);
  };
  const nextRound = () => {
    randomCountry();
    reset();
  };
  const save = async () => {
    setBusy(true);
    try {
      const blob = await resultImage(country, strokes, score, seconds);
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
    const url = new URL(location.origin);
    url.searchParams.set("country", country.id);
    url.searchParams.set("time", String(seconds));
    const text = `I drew ${country.name} in ${seconds} seconds and got ${score}% shape match on Borderline. Can you beat that?`;
    try {
      if (navigator.share) {
        const blob = await resultImage(country, strokes, score, seconds);
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="wordmark"
          onClick={reset}
          disabled={phase === "drawing"}
          aria-label="Borderline home"
        >
          <span className="brand-icon">
            <Pencil size={20} />
          </span>
          borderline<span className="brand-dot">.</span>
        </button>
        <div className="topbar-right">
          <span className="edition">
            A LITTLE GEOGRAPHY. A LOT OF GUESSWORK.
          </span>
          <button
            className="help-button"
            onClick={() => dialog.current?.showModal()}
            aria-label="How to play"
          >
            <HelpCircle size={19} />
            <span>How to play</span>
          </button>
        </div>
      </header>

      <main>
        {phase === "setup" && (
          <>
            <div className="intro">
              <span className="eyebrow">
                <Globe2 size={16} /> THE WORLD, ACCORDING TO YOU
              </span>
              <h1>
                Great memory?
                <br />
                Draw the <span className="underlined">line.</span>
              </h1>
              <p>
                A country. A blank canvas. {seconds} seconds to embarrass your
                geography teacher.
              </p>
            </div>
            <section
              className="game-layout"
              aria-label="Set up your drawing round"
            >
              <div className="setup-card">
                <div className="card-heading">
                  <span className="step-badge">01</span>
                  <span>YOUR NEXT MASTERPIECE</span>
                </div>
                <div className="country-prompt">
                  <span className="flag" aria-hidden="true">
                    {country.flag}
                  </span>
                  <h2>{country.name}</h2>
                  <span
                    className={`difficulty ${country.difficulty.toLowerCase()}`}
                  >
                    <span aria-hidden="true">
                      {country.difficulty === "Spicy"
                        ? "🌶️"
                        : country.difficulty === "Starter"
                          ? "✦"
                          : "✦ ✦"}
                    </span>{" "}
                    {country.difficulty}
                  </span>
                </div>
                <div className="country-actions">
                  <button className="text-button" onClick={randomCountry}>
                    <IconLabel icon={Shuffle}>Surprise me</IconLabel>
                  </button>
                  <label className="country-picker">
                    <span className="sr-only">Choose a country</span>
                    <select
                      value={country.id}
                      onChange={(event) => {
                        setCountry(
                          maps.find((map) => map.id === event.target.value)!,
                        );
                        setDaily(false);
                      }}
                      aria-label="Choose a country"
                    >
                      {maps.map((map) => (
                        <option key={map.id} value={map.id}>
                          {map.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="setting-label">
                  <span>How much time?</span>
                  <Clock3 size={16} />
                </div>
                <div
                  className="duration-switch"
                  role="group"
                  aria-label="Round duration"
                >
                  {[30, 60].map((duration) => (
                    <button
                      key={duration}
                      aria-pressed={seconds === duration}
                      className={seconds === duration ? "selected" : ""}
                      onClick={() => setSeconds(duration)}
                    >
                      <strong>
                        {duration}
                        <small> sec</small>
                      </strong>
                      <span>
                        {duration === 30 ? "Pure chaos" : "Room to breathe"}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  className="primary start-button"
                  onClick={start}
                  disabled={!ready}
                >
                  <IconLabel icon={Pencil}>
                    {daily ? "Play today’s challenge" : "Let’s draw"}
                  </IconLabel>
                </button>
                <p className="start-note">
                  No sign-up. No skills required. Clearly.
                </p>
              </div>
              <div className="board-card">
                <div className="board-top">
                  <span>
                    <span className="ink-dot" />
                    YOUR BLANK SLATE
                  </span>
                  <span>{seconds} SECONDS · FROM MEMORY</span>
                </div>
                <DrawingBoard
                  strokes={[]}
                  onChange={changeInk}
                  active={false}
                  acceptInput={acceptInput}
                />
                <div className="board-bottom">
                  <span>
                    <Pencil size={15} /> Draw
                  </span>
                  <i>·</i>
                  <span>
                    <Clock3 size={15} /> Race the clock
                  </span>
                  <i>·</i>
                  <span>
                    <Sparkles size={15} /> Face reality
                  </span>
                </div>
              </div>
            </section>
            <button
              className={`daily-strip ${daily ? "daily-selected" : ""}`}
              onClick={() => {
                setCountry(dailyMap());
                setSeconds(30);
                setDaily(true);
              }}
            >
              <span className="daily-icon">
                <Sparkles size={21} />
              </span>
              <span>
                <strong>
                  {daily
                    ? "Today’s challenge is ready."
                    : "Same country. Everyone. Every day."}
                </strong>
                <span>
                  Try the daily challenge and settle the group-chat debate.
                </span>
              </span>
              <span className="daily-cta">
                {daily ? (
                  <>
                    <Check size={16} /> Selected
                  </>
                ) : (
                  "Play daily"
                )}
              </span>
            </button>
          </>
        )}

        {phase === "drawing" && (
          <section className="play-screen" aria-label="Drawing round">
            <div className="play-heading">
              <div>
                <span className="eyebrow">NO LOOKING IT UP</span>
                <h1>
                  Draw {country.name}
                  <span aria-hidden="true"> {country.flag}</span>
                </h1>
              </div>
              <div
                className={`timer ${remaining <= 5 ? "urgent" : ""}`}
                role="timer"
                aria-label={`${remaining} seconds remaining`}
              >
                <Clock3 size={24} />
                <strong>{String(remaining).padStart(2, "0")}</strong>
                <span>sec</span>
              </div>
            </div>
            <div className="timer-track" aria-hidden="true">
              <div style={{ width: `${(remaining / seconds) * 100}%` }} />
            </div>
            <div className="board-card active-board">
              <div className="board-top">
                <span>
                  <span className="ink-dot" />
                  YOUR VERSION OF {country.name.toUpperCase()}
                </span>
                <span>
                  {remaining <= 5 ? "LAST FEW SECONDS!" : "TRUST YOUR MEMORY"}
                </span>
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
            </div>
            <p className="playing-note">
              Draw the outer border. Imperfect is the whole point.
            </p>
          </section>
        )}

        {phase === "result" && (
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
                  <span>{seconds} SEC</span>
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
                  {country.flag} {country.name}, apparently.
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
                  {country.flag} {country.name}, geographically.
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
                    {country.name} · {seconds} seconds
                  </span>
                </span>
              </div>
            </div>
            <p className="score-note">
              A playful outline comparison, adjusted for size and position. Not
              a geography exam.
            </p>
            <div className="result-actions">
              <button className="primary" onClick={nextRound}>
                <IconLabel icon={Shuffle}>Another country</IconLabel>
              </button>
              <button className="secondary" onClick={start}>
                <IconLabel icon={RotateCcw}>Try {country.name} again</IconLabel>
              </button>
            </div>
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
      </main>
      <footer>
        <span>Made for questionable cartographers.</span>
        <span>
          {rounds > 0
            ? `${rounds} ${rounds === 1 ? "country" : "countries"} reimagined this visit`
            : "18 countries. Infinite creative liberties."}
        </span>
        <span>
          Simplified outlines ·{" "}
          <a
            href="https://www.naturalearthdata.com/about/terms-of-use/"
            target="_blank"
            rel="noreferrer"
          >
            Natural Earth
          </a>
        </span>
      </footer>
      <div className="toast" role="status" aria-live="polite">
        {toast && <span>{toast}</span>}
      </div>
      <dialog ref={dialog} className="help-dialog">
        <button
          className="close-dialog"
          aria-label="Close instructions"
          onClick={() => dialog.current?.close()}
        >
          <X size={22} />
        </button>
        <span className="eyebrow">YOUR 15-SECOND BRIEFING</span>
        <h2>
          Good borders.
          <br />
          Bad borders. All welcome.
        </h2>
        <ol>
          <li>
            <strong>Pick your pressure.</strong>
            <span>Choose a country and a 30- or 60-second timer.</span>
          </li>
          <li>
            <strong>Draw from memory.</strong>
            <span>
              Use a finger, mouse, or stylus. Undo and clear are your friends.
            </span>
          </li>
          <li>
            <strong>Meet reality.</strong>
            <span>
              Time’s up? Compare your drawing with the real outline. Save it,
              share it, or try another.
            </span>
          </li>
        </ol>
        <p>
          Shape scores are just for fun. Bests stay on this device. Nothing is
          posted publicly.
        </p>
        <button className="primary" onClick={() => dialog.current?.close()}>
          Got it. Let’s make a map.
        </button>
      </dialog>
    </div>
  );
}
