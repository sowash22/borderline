"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  Globe2,
  Linkedin,
  Pencil,
  RotateCcw,
  Share2,
  Shuffle,
  Trash2,
  Trophy,
  Undo2,
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
const storageKey = "borderline:bests:v2";
const defaultMap = maps.find((map) => map.code === "IT")!;
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

export default function Game({ initialCountryId }: { initialCountryId?: string } = {}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [country, setCountry] = useState(() => maps.find((map) => map.id === initialCountryId) ?? defaultMap);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [score, setScore] = useState(0);
  const [bests, setBests] = useState<Bests>({});
  const [newBest, setNewBest] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [linkFallback, setLinkFallback] = useState("");
  const [ready, setReady] = useState(false);
  const phaseRef = useRef<Phase>("setup"),
    ink = useRef<Stroke[]>([]);
  const recent = useRef<string[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const best = bests[country.id] ?? 0;
  const judgement = verdict(score, !strokes.length);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      if (saved && typeof saved === "object")
        setBests(
          Object.fromEntries(
            Object.entries(saved).filter(
              ([key, value]) =>
                /^\d{3}$/.test(key) &&
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
    const key = country.id;
    setNewBest(result > (bests[key] ?? 0));
    const updated = { ...bests, [key]: Math.max(bests[key] ?? 0, result) };
    setBests(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      /* Best scores are optional. */
    }
  }, [country, bests]);

  useEffect(() => {
    if (phase === "result") titleRef.current?.focus();
  }, [phase]);

  const changeInk = (value: Stroke[]) => {
    ink.current = value;
    setStrokes(value);
  };
  const acceptInput = () => phaseRef.current === "drawing";
  const start = () => {
    changeInk([]);
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
  };
  const nextRound = () => {
    randomCountry();
    reset();
  };
  const save = async () => {
    setBusy(true);
    try {
      const blob = await resultImage(country, strokes, score);
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
    const text = `I drew ${country.name} and got ${score}% shape match on Borderline. Can you beat that?`;
    try {
      if (navigator.share) {
        const blob = await resultImage(country, strokes, score);
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
      </header>

      <main>
        {phase === "setup" && (
          <section className="simple-landing" aria-label="Start a drawing round">
            <div className="intro">
              <h1>Draw a country<br />from memory.</h1>
              <p>Draw its outline at your own pace.<br />Then see how close you got to the real map.</p>
            </div>
            <div className="setup-card simple-setup">
              <label className="simple-country" htmlFor="country">
                Choose a country
              </label>
              <div className="simple-country-row">
                <span className="flag" aria-hidden="true">{country.flag}</span>
                <select
                  id="country"
                  value={country.id}
                  onChange={(event) => setCountry(maps.find((map) => map.id === event.target.value)!)}
                >
                  {maps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}
                </select>
              </div>
              <button className="text-button surprise-button" onClick={randomCountry}>
                <IconLabel icon={Shuffle}>Surprise me</IconLabel>
              </button>
              <button className="primary start-button" onClick={start} disabled={!ready}>
                <IconLabel icon={Pencil}>Let’s draw</IconLabel>
              </button>
            </div>
            <p className="origin-note">
              I built this for my two-year-old to draw and discover countries.
              Then I thought: why should kids have all the fun?
            </p>
          </section>
        )}

        {phase === "drawing" && (
          <section className="play-screen" aria-label="Drawing round">
            <div className="play-heading">
              <div>
                <h1>
                  Draw {country.name}
                  <span aria-hidden="true"> {country.flag}</span>
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
              {country.scope ? "Draw the contiguous 48 states with your finger, mouse, or stylus." : "Draw with your finger, mouse, or stylus."}
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
                  {country.flag} {country.scope || country.name}, geographically.
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
      <footer className="compact-footer">
        <nav className="creator-footer" aria-label="Creator links">
          <a className="creator-name" href="https://ashok-marannan.vercel.app/" target="_blank" rel="noopener noreferrer">
            Ashok <span>Marannan</span>
          </a>
          <a className="creator-social" href="https://www.linkedin.com/in/ashokmarannan/" target="_blank" rel="noopener noreferrer" aria-label="Ashok Marannan on LinkedIn" title="LinkedIn">
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
