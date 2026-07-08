"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { useFearGreed, type FearGreedData } from "./use-fear-greed";
import {
  DEFAULT_FEAR_GREED_BANDS,
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  GRADIENT_STOPS,
  angleForValue,
  arcPoint,
  colorForValue,
  describeArc,
  describeWedge,
  findFearGreedBand,
} from "./fear-greed-bands";

export interface FearGreedGaugeProps {
  /** Provide your own data to bypass the bundled alternative.me fetcher. */
  data?: FearGreedData;
  /** "gradient" (default) is a smooth continuous color blend with just the dial, needle, and number; "minimal" shows the same layout with 5 discrete color bands instead; "ticks" swaps the solid arc for 100 individual gradient tick marks; "wedges" shows pie-slice zone sectors with the current zone highlighted. */
  variant?: "minimal" | "ticks" | "gradient" | "wedges";
  className?: string;
}

// "ticks" variant: 100 individual gradient tick marks (one per index value)
// instead of a solid colored arc, plus the same 0/20/40/50/60/80/100 numeric
// labels as reference speedometer-style gauges.
const TICKS_MAJOR_VALUES = [0, 20, 40, 50, 60, 80, 100];
const TICKS_FINE_VALUES = Array.from({ length: 100 }, (_, i) => i + 1);

// "wedges" variant: pie-slice zone sectors instead of a thin arc, with the
// zone matching the current value highlighted and the rest neutral gray.
const WEDGE_OUTER_RADIUS = 100;
const WEDGE_INNER_RADIUS = 62;
const WEDGE_GAP = 0.8;
const WEDGE_LABEL_INNER_RADIUS = 70;
const WEDGE_LABEL_OUTER_RADIUS = 94;
const WEDGE_SCALE_NUMBER_VALUES = [0, 25, 50, 75, 100];
const WEDGE_SCALE_DOT_VALUES = Array.from({ length: 21 }, (_, i) => i * 5);
const WEDGE_SCALE_DOT_RADIUS = 48;
const WEDGE_SCALE_NUMBER_RADIUS = 56;
const WEDGE_HUB_RADIUS = 40;

function labelAnchor(value: number): "start" | "middle" | "end" {
  if (value < 45) return "start";
  if (value > 55) return "end";
  return "middle";
}

export function FearGreedGauge({ data, variant = "gradient", className }: FearGreedGaugeProps) {
  const gradientId = React.useId();
  const fetched = useFearGreed({ enabled: data === undefined });
  const resolved = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const value = resolved?.value ?? null;
  const label = resolved?.label ?? "Unknown";
  const hasError = data === undefined && Boolean(fetched.error);
  const needleRotation = value !== null ? 90 - angleForValue(value) : 0;
  const activeBand = variant === "wedges" && value !== null ? findFearGreedBand(value) : null;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg
        viewBox={variant === "wedges" ? "0 0 260 190" : "0 0 260 158"}
        className="w-full max-w-[300px]"
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
              // At the 0/100 endpoints the tick is perfectly horizontal, so a
              // wide label like "100" extends backward right over the tick
              // instead of past it (unlike the angled major ticks in between).
              // Push those two down onto their own line instead.
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
                    band.min + WEDGE_GAP,
                    band.max - WEDGE_GAP,
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
              const mid = (band.min + band.max) / 2;
              // A radial textPath clips text past its (short) path length -
              // fine for "FEAR"/"GREED" but drops characters from "NEUTRAL"
              // and the two-word EXTREME labels. Plain rotated text with
              // tspans has no such limit, so split multi-word labels onto
              // their own stacked lines instead.
              const rotation = 90 - angleForValue(mid);
              const p = arcPoint((WEDGE_LABEL_INNER_RADIUS + WEDGE_LABEL_OUTER_RADIUS) / 2, mid);
              const words = band.label.toUpperCase().split(" ");
              return (
                <text
                  key={band.key}
                  textAnchor="middle"
                  transform={`rotate(${rotation} ${p.x} ${p.y})`}
                  className="fill-foreground text-[8px] font-extrabold uppercase tracking-wider"
                >
                  {words.map((word, i) => (
                    <tspan key={word} x={p.x} y={p.y} dy={`${(i - (words.length - 1) / 2) * 1.1}em`}>
                      {word}
                    </tspan>
                  ))}
                </text>
              );
            })}
            {WEDGE_SCALE_DOT_VALUES.filter(
              (v) => !WEDGE_SCALE_NUMBER_VALUES.some((n) => Math.abs(v - n) <= 5),
            ).map((v) => {
              // Dots within one tick step of a numeric label sit close enough
              // to read as a stray decimal point glued onto the number (e.g.
              // "25." or ".75") - skip them here since the number itself
              // already marks that position.
              const p = arcPoint(WEDGE_SCALE_DOT_RADIUS, v);
              return <circle key={`dot-${v}`} cx={p.x} cy={p.y} r={1} className="fill-muted-foreground/50" />;
            })}
            {WEDGE_SCALE_NUMBER_VALUES.map((v) => {
              const isEdge = v === 0 || v === 100;
              const p = arcPoint(WEDGE_SCALE_NUMBER_RADIUS, v);
              return (
                <text
                  key={`scale-${v}`}
                  x={p.x}
                  y={isEdge ? p.y - 3 : p.y}
                  textAnchor={labelAnchor(v)}
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[8px] font-medium tabular-nums"
                >
                  {v}
                </text>
              );
            })}
          </>
        )}

        {value !== null && !loading && (
          <g transform={`rotate(${needleRotation} ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y})`}>
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
            {variant === "wedges" ? (
              <circle
                cx={GAUGE_CENTER_X}
                cy={GAUGE_CENTER_Y}
                r={WEDGE_HUB_RADIUS}
                strokeWidth={1}
                className="fill-background stroke-border"
              />
            ) : (
              <>
                <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={6} className="fill-foreground" />
                <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={2.5} className="fill-background" />
              </>
            )}
          </g>
        )}
      </svg>
      <div className={cn("text-center", variant === "wedges" ? "-mt-16" : "-mt-4")}>
        {loading ? (
          <div role="status">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading Fear &amp; Greed Index</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
