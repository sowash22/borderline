"use client";
import { useEffect, useRef, type PointerEvent } from "react";
import { Pencil } from "lucide-react";
import { strokePath, type Point, type Stroke } from "@/lib/scoring";

export default function DrawingBoard({
  strokes,
  onChange,
  onPreview,
  active,
  acceptInput,
}: {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  onPreview?: (strokes: Stroke[]) => void;
  active: boolean;
  acceptInput: () => boolean;
}) {
  const paper = useRef<HTMLDivElement>(null);
  const live = useRef<SVGPathElement>(null);
  const ink = useRef<Stroke>([]);
  const pointer = useRef<number | null>(null);
  useEffect(() => {
    const surface = paper.current;
    if (!active || !surface) return;
    // Native non-passive listeners let mobile browsers cancel page scrolling.
    // React's delegated touch listeners may be passive, so use the surface itself.
    const preventScroll = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
    };
    surface.addEventListener("touchstart", preventScroll, { passive: false });
    surface.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      surface.removeEventListener("touchstart", preventScroll);
      surface.removeEventListener("touchmove", preventScroll);
    };
  }, [active]);
  const point = (event: PointerEvent<SVGSVGElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        2,
        Math.min(598, ((event.clientX - bounds.left) / bounds.width) * 600),
      ),
      y: Math.max(
        2,
        Math.min(398, ((event.clientY - bounds.top) / bounds.height) * 400),
      ),
    };
  };
  const end = (event: PointerEvent<SVGSVGElement>) => {
    if (pointer.current !== event.pointerId) return;
    if (active && acceptInput() && ink.current.length)
      onChange([...strokes, ink.current]);
    pointer.current = null;
    ink.current = [];
    live.current?.setAttribute("d", "");
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return (
    <div ref={paper} className={`paper ${active ? "drawing" : ""}`}>
      {!active && (
        <div className="paper-intro">
          <span className="pencil-mark">
            <Pencil size={30} strokeWidth={1.8} />
          </span>
          <h2>Your masterpiece goes here.</h2>
          <p>No tracing. No googling. Just vibes.</p>
          <span className="paper-caption">
            FINGER, MOUSE, OR VERY CONFIDENT STYLUS
          </span>
        </div>
      )}
      {active && strokes.length === 0 && (
        <div className="draw-hint">
          Draw the outline here.
        </div>
      )}
      <svg
        viewBox="0 0 600 400"
        aria-label={
          active
            ? "Drawing area. Use your finger, mouse, or stylus to draw the country outline."
            : "Blank drawing area"
        }
        role="img"
        onPointerDown={(event) => {
          if (
            !active ||
            !acceptInput() ||
            pointer.current !== null ||
            event.button !== 0 ||
            strokes.length >= 200
          )
            return;
          event.preventDefault();
          pointer.current = event.pointerId;
          ink.current = [point(event)];
          onPreview?.([...strokes, ink.current]);
          event.currentTarget.setPointerCapture(event.pointerId);
          live.current?.setAttribute("d", strokePath(ink.current));
        }}
        onPointerMove={(event) => {
          if (pointer.current !== event.pointerId || !active || !acceptInput())
            return;
          event.preventDefault();
          const next = point(event);
          const last = ink.current.at(-1)!;
          if (Math.hypot(next.x - last.x, next.y - last.y) < 1) return;
          if (
            ink.current.length >= 3000 ||
            strokes.reduce((sum, s) => sum + s.length, 0) +
              ink.current.length >=
              12000
          )
            return;
          ink.current.push(next);
          live.current?.setAttribute("d", strokePath(ink.current));
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={(event) => {
          if (pointer.current === event.pointerId) end(event);
        }}
      >
        <g
          fill="none"
          stroke="#6746eb"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {strokes.map((stroke, i) => (
            <path key={i} d={strokePath(stroke)} />
          ))}
          <path ref={live} />
        </g>
      </svg>
      <span className="paper-corner">B.</span>
    </div>
  );
}
