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
  equalizedValue,
  findFearGreedBand,
} from "./fear-greed-bands";

export interface FearGreedGaugeProps {
  /** Provide your own data to bypass the bundled alternative.me fetcher. */
  data?: FearGreedData;
  /** "gradient" (default) is a smooth continuous color blend with just the dial, needle, and number; "minimal" shows the same layout with 5 discrete color bands instead; "ticks" swaps the solid arc for 100 individual gradient tick marks; "wedges" shows equal-width pie-slice zone sectors (CNN-style, with the dial remapped to match) and the current zone highlighted. */
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
const WEDGE_OUTER_RADIUS = 104;
const WEDGE_INNER_RADIUS = 64;
const WEDGE_GAP = 1.2;
const WEDGE_LABEL_RADIUS = (WEDGE_OUTER_RADIUS + WEDGE_INNER_RADIUS) / 2;
const WEDGE_BAND_SHARE = 100 / DEFAULT_FEAR_GREED_BANDS.length;
// With equalized wedges every wedge corner is a real band boundary, so the
// scale numbers sit at the corners and each zone's true value range reads
// straight off the dial (neutral between 45 and 55, greed 55-75, ...).
const WEDGE_SCALE_NUMBER_VALUES = [0, 25, 45, 55, 75, 100];
// Two decorative dots per zone, at thirds between the corner numbers. They
// mark display positions, not round values: the dial is equalized per band
// (see equalizedValue), so in-between values don't land on round angles.
const WEDGE_SCALE_DOT_DISPLAY_VALUES = DEFAULT_FEAR_GREED_BANDS.flatMap((_, i) => [
  (i + 1 / 3) * WEDGE_BAND_SHARE,
  (i + 2 / 3) * WEDGE_BAND_SHARE,
]);
const WEDGE_SCALE_DOT_RADIUS = 48;
const WEDGE_SCALE_NUMBER_RADIUS = 56;
const WEDGE_HUB_RADIUS = 40;
// Tall enough for the full hub circle (center y 130 + radius 40) plus a small
// bottom margin; also the denominator for the centered value overlay's top %.
const WEDGES_VIEWBOX_HEIGHT = 180;

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
  // The wedges dial is drawn in equalized display space (see equalizedValue),
  // so its needle has to go through the same remapping to land inside the
  // highlighted wedge.
  const dialValue = value !== null && variant === "wedges" ? equalizedValue(value) : value;
  const needleRotation = dialValue !== null ? 90 - angleForValue(dialValue) : 0;
  const activeBand = variant === "wedges" && value !== null ? findFearGreedBand(value) : null;

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
                // A radial textPath clips text past its (short) path length -
                // fine for "FEAR"/"GREED" but drops characters from "NEUTRAL"
                // and the two-word EXTREME labels. Plain rotated text with
                // tspans has no such limit, so split multi-word labels onto
                // their own stacked lines instead.
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
            {loading ? (
              <div role="status">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Loading Fear &amp; Greed Index</span>
              </div>
            ) : (
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {value !== null ? <NumberFlow value={value} /> : "-"}
                {/* The zone name is only drawn inside the aria-hidden SVG for
                    this variant, so repeat it for screen readers. */}
                {!hasError && <span className="sr-only"> {label}</span>}
              </p>
            )}
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
      )}
    </div>
  );
}
