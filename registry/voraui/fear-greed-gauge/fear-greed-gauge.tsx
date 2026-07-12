"use client";

import { useEffect, useId, useRef } from "react";
import { animate, useMotionValue } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { FearGreedGaugeSkeleton } from "./components/skeleton";
import { useFearGreed, type FearGreedData } from "./hooks/use-fear-greed";
import {
  DEFAULT_FEAR_GREED_BANDS,
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  GRADIENT_STOPS,
  WEDGE_GAP,
  WEDGE_HUB_RADIUS,
  WEDGE_INNER_RADIUS,
  WEDGE_OUTER_RADIUS,
  WEDGES_VIEWBOX_HEIGHT,
  angleForValue,
  arcPoint,
  colorForValue,
  describeArc,
  describeWedge,
  equalizedValue,
  findFearGreedBand,
} from "./lib/fear-greed-bands";

export interface FearGreedGaugeProps {
  /** Provide your own data to bypass the bundled alternative.me fetcher. */
  data?: FearGreedData;
  /** "gradient" (default) smooth blend; "minimal" 5 discrete bands; "ticks" 100 tick marks; "wedges" CNN-style zone sectors. */
  variant?: "minimal" | "ticks" | "gradient" | "wedges";
  /** Spring the needle in from neutral on first render instead of snapping. */
  animateOnLoad?: boolean;
  className?: string;
}

const TICKS_MAJOR_VALUES = [0, 25, 50, 75, 100];
const TICKS_FINE_VALUES = Array.from({ length: 100 }, (_, i) => i + 1);

const WEDGE_LABEL_RADIUS = (WEDGE_OUTER_RADIUS + WEDGE_INNER_RADIUS) / 2;
const WEDGE_BAND_SHARE = 100 / DEFAULT_FEAR_GREED_BANDS.length;
// Equalized wedge corners are real band boundaries, so numbers sit at the corners.
const WEDGE_SCALE_NUMBER_VALUES = [0, 25, 45, 55, 75, 100];
// Decorative dots at thirds between the corner numbers (display positions, not values).
const WEDGE_SCALE_DOT_DISPLAY_VALUES = DEFAULT_FEAR_GREED_BANDS.flatMap((_, i) => [
  (i + 1 / 3) * WEDGE_BAND_SHARE,
  (i + 2 / 3) * WEDGE_BAND_SHARE,
]);
const WEDGE_SCALE_DOT_RADIUS = 48;
const WEDGE_SCALE_NUMBER_RADIUS = 56;

function labelAnchor(value: number): "start" | "middle" | "end" {
  if (value < 45) return "start";
  if (value > 55) return "end";
  return "middle";
}

export function FearGreedGauge({
  data,
  variant = "gradient",
  animateOnLoad = true,
  className,
}: FearGreedGaugeProps) {
  const gradientId = useId();
  const fetched = useFearGreed({ enabled: data === undefined });
  const resolved = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const value = resolved?.value ?? null;
  const label = resolved?.label ?? "Unknown";
  const hasError = data === undefined && Boolean(fetched.error);
  // The wedges dial is drawn in equalized space; remap the needle to match.
  const dialValue = value !== null && variant === "wedges" ? equalizedValue(value) : value;
  const needleRotation = dialValue !== null ? 90 - angleForValue(dialValue) : 0;
  const activeBand = variant === "wedges" && value !== null ? findFearGreedBand(value) : null;

  // Drive the SVG rotate() attribute imperatively: framer's transform pipeline
  // drops 3-arg SVG rotate() and would pivot around the wrong origin.
  const needleGroupRef = useRef<SVGGElement | null>(null);
  const needleMV = useMotionValue(needleRotation);
  useEffect(() => {
    return needleMV.on("change", (r) => {
      needleGroupRef.current?.setAttribute("transform", `rotate(${r} ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y})`);
    });
  }, [needleMV]);
  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    const justLoaded = value !== null && !hasLoadedOnceRef.current;
    if (value !== null) hasLoadedOnceRef.current = true;

    if (justLoaded && !animateOnLoad) {
      needleMV.set(needleRotation);
      return;
    }
    const controls = animate(needleMV, needleRotation, { type: "spring", stiffness: 100 });
    return controls.stop;
  }, [needleRotation, value, animateOnLoad, needleMV]);

  if (loading) {
    return <FearGreedGaugeSkeleton variant={variant} className={className} />;
  }

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className="relative w-full max-w-[300px]">
        <svg
          viewBox={variant === "wedges" ? `0 0 260 ${WEDGES_VIEWBOX_HEIGHT}` : "0 0 260 158"}
          className="w-full"
          aria-hidden="true"
        >
          {variant === "minimal" &&
            DEFAULT_FEAR_GREED_BANDS.map((band) => (
              <path
                key={band.key}
                d={describeArc(90, band.min, band.max)}
                fill="none"
                stroke={band.color}
                strokeWidth={12}
                strokeLinecap="round"
              />
            ))}

          {variant === "gradient" && (
            <>
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                  {GRADIENT_STOPS.map((stop) => (
                    <stop key={stop.value} offset={`${stop.value}%`} stopColor={stop.color} />
                  ))}
                </linearGradient>
              </defs>
              <path
                d={describeArc(90, 0, 100)}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={12}
                strokeLinecap="round"
              />
            </>
          )}

          {variant === "ticks" && (
            <>
              {TICKS_FINE_VALUES.map((v) => {
                const inner = arcPoint(96, v);
                const outer = arcPoint(103, v);
                return (
                  <line
                    key={`fine-${v}`}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    strokeWidth={1.2}
                    stroke={colorForValue(v)}
                  />
                );
              })}
              {TICKS_MAJOR_VALUES.map((v) => {
                const inner = arcPoint(92, v);
                const outer = arcPoint(107, v);
                return (
                  <line
                    key={`major-${v}`}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    strokeWidth={2}
                    stroke={colorForValue(v)}
                  />
                );
              })}
              {TICKS_MAJOR_VALUES.map((v) => {
                const p = arcPoint(118, v);
                // The horizontal 0/100 end labels overlap their ticks; push them down a line.
                const isEdge = v === 0 || v === 100;
                return (
                  <text
                    key={`num-${v}`}
                    x={p.x}
                    y={isEdge ? p.y + 14 : p.y}
                    textAnchor={labelAnchor(v)}
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[9px] font-medium tabular-nums"
                  >
                    {v}
                  </text>
                );
              })}
            </>
          )}

          {variant === "wedges" && (
            <>
              {DEFAULT_FEAR_GREED_BANDS.map((band) => {
                const isActive = activeBand?.key === band.key;
                return (
                  <path
                    key={band.key}
                    d={describeWedge(
                      WEDGE_OUTER_RADIUS,
                      WEDGE_INNER_RADIUS,
                      equalizedValue(band.min) + WEDGE_GAP,
                      equalizedValue(band.max) - WEDGE_GAP,
                    )}
                    fill={isActive ? band.color : undefined}
                    fillOpacity={isActive ? 0.25 : undefined}
                    stroke={isActive ? band.color : undefined}
                    strokeWidth={isActive ? 1.5 : undefined}
                    className={isActive ? undefined : "fill-muted stroke-border"}
                  />
                );
              })}
              {DEFAULT_FEAR_GREED_BANDS.map((band) => {
                const mid = equalizedValue((band.min + band.max) / 2);
                // textPath clips long labels; rotated text with stacked tspans doesn't.
                const rotation = 90 - angleForValue(mid);
                const p = arcPoint(WEDGE_LABEL_RADIUS, mid);
                const words = band.label.toUpperCase().split(" ");
                return (
                  <text
                    key={band.key}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${rotation} ${p.x} ${p.y})`}
                    className="fill-foreground text-[7.5px] font-extrabold uppercase tracking-wider"
                  >
                    {words.map((word, i) => (
                      <tspan key={word} x={p.x} y={p.y} dy={`${(i - (words.length - 1) / 2) * 1.3}em`}>
                        {word}
                      </tspan>
                    ))}
                  </text>
                );
              })}
              {WEDGE_SCALE_DOT_DISPLAY_VALUES.map((d) => {
                const p = arcPoint(WEDGE_SCALE_DOT_RADIUS, d);
                return <circle key={`dot-${d}`} cx={p.x} cy={p.y} r={1} className="fill-muted-foreground/50" />;
              })}
              {WEDGE_SCALE_NUMBER_VALUES.map((v) => {
                const isEdge = v === 0 || v === 100;
                const p = arcPoint(WEDGE_SCALE_NUMBER_RADIUS, equalizedValue(v));
                return (
                  <text
                    key={`scale-${v}`}
                    x={p.x}
                    y={isEdge ? p.y - 3 : p.y}
                    textAnchor={labelAnchor(equalizedValue(v))}
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[8px] font-medium tabular-nums"
                  >
                    {v}
                  </text>
                );
              })}
            </>
          )}

          {value !== null && (
            <g ref={needleGroupRef} transform={`rotate(${needleMV.get()} ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y})`}>
              {variant === "wedges" ? (
                <polygon
                  points={`${GAUGE_CENTER_X - 4},${GAUGE_CENTER_Y - 58} ${GAUGE_CENTER_X},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X + 4},${GAUGE_CENTER_Y - 58} ${GAUGE_CENTER_X + 4},${GAUGE_CENTER_Y + 20} ${GAUGE_CENTER_X - 4},${GAUGE_CENTER_Y + 20}`}
                  fill={activeBand?.color}
                  className={activeBand ? undefined : "fill-foreground"}
                />
              ) : (
                <polygon
                  points={`${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X},${GAUGE_CENTER_Y - 72} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y + 15} ${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y + 15}`}
                  className="fill-foreground"
                />
              )}
              {variant !== "wedges" && (
                <>
                  <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={6} className="fill-foreground" />
                  <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={2.5} className="fill-background" />
                </>
              )}
            </g>
          )}

          {variant === "wedges" && (
            <circle
              cx={GAUGE_CENTER_X}
              cy={GAUGE_CENTER_Y}
              r={WEDGE_HUB_RADIUS}
              strokeWidth={1}
              className="fill-background stroke-border"
            />
          )}
        </svg>
        {variant === "wedges" && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ top: `${(GAUGE_CENTER_Y / WEDGES_VIEWBOX_HEIGHT) * 100}%` }}
          >
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {value !== null ? <NumberFlow value={value} /> : "-"}
              {/* The zone name only exists in the aria-hidden SVG; repeat it for screen readers. */}
              {!hasError && <span className="sr-only"> {label}</span>}
            </p>
          </div>
        )}
      </div>
      {variant === "wedges" ? (
        hasError && (
          <p role="alert" className="text-xs font-medium text-muted-foreground">
            Fear &amp; Greed data is unavailable.
          </p>
        )
      ) : (
        <div className="-mt-4 text-center">
          <p className="text-3xl font-bold tabular-nums text-foreground">
            {value !== null ? <NumberFlow value={value} /> : "-"}
          </p>
          {hasError ? (
            <p role="alert" className="text-xs font-medium text-muted-foreground">
              Fear &amp; Greed data is unavailable.
            </p>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          )}
        </div>
      )}
    </div>
  );
}
