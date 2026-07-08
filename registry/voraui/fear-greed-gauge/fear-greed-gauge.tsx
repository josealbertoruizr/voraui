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
} from "./fear-greed-bands";

export interface FearGreedGaugeProps {
  /** Provide your own data to bypass the bundled alternative.me fetcher. */
  data?: FearGreedData;
  /** "full" shows the zone labels around the dial with 5 discrete color bands; "minimal" shows just the dial, needle, and number; "ticks" swaps the solid arc for 100 individual gradient tick marks; "gradient" is "minimal" with one continuous color blend instead of discrete bands. */
  variant?: "full" | "minimal" | "ticks" | "gradient";
  className?: string;
}

const EDGE_ZONE_LABELS: Array<{ value: number; text: string }> = [
  { value: 0, text: "EXTREME FEAR" },
  { value: 100, text: "EXTREME GREED" },
];
// The short single-word labels curve along the arc's gentle upper section
// (value 15-85) via textPath. The two-word EXTREME labels sit near the ends,
// where that same arc is nearly vertical, so curving them would tip them
// almost sideways - they stay as plain horizontal text instead.
const CURVE_PATH_FROM = 15;
const CURVE_PATH_TO = 85;
const CURVED_ZONE_LABELS: Array<{ text: string; startOffset: string }> = [
  { text: "FEAR", startOffset: "10%" },
  { text: "NEUTRAL", startOffset: "50%" },
  { text: "GREED", startOffset: "90%" },
];

// "ticks" variant: 100 individual gradient tick marks (one per index value)
// instead of a solid colored arc, plus the same 0/20/40/50/60/80/100 numeric
// labels as reference speedometer-style gauges.
const TICKS_MAJOR_VALUES = [0, 20, 40, 50, 60, 80, 100];
const TICKS_FINE_VALUES = Array.from({ length: 100 }, (_, i) => i + 1);

function labelAnchor(value: number): "start" | "middle" | "end" {
  if (value < 45) return "start";
  if (value > 55) return "end";
  return "middle";
}

export function FearGreedGauge({ data, variant = "full", className }: FearGreedGaugeProps) {
  const curveId = React.useId();
  const gradientId = React.useId();
  const fetched = useFearGreed({ enabled: data === undefined });
  const resolved = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const value = resolved?.value ?? null;
  const label = resolved?.label ?? "Unknown";
  const hasError = data === undefined && Boolean(fetched.error);
  const needleRotation = value !== null ? 90 - angleForValue(value) : 0;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg viewBox="0 0 260 158" className="w-full max-w-[300px]" aria-hidden="true">
        {(variant === "full" || variant === "minimal") &&
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

        {variant === "full" && (
          <>
            <path id={curveId} d={describeArc(126, CURVE_PATH_FROM, CURVE_PATH_TO)} fill="none" stroke="none" />
            {CURVED_ZONE_LABELS.map((zone) => (
              <text
                key={zone.text}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px] font-semibold uppercase tracking-wider"
              >
                <textPath href={`#${curveId}`} startOffset={zone.startOffset}>
                  {zone.text}
                </textPath>
              </text>
            ))}
            {EDGE_ZONE_LABELS.map((zone) => {
              const p = arcPoint(126, zone.value);
              // These sit on the same baseline as the "0"/"100" numeric ticks
              // (both endpoints have the same y at this radius), so push them
              // down onto their own line to avoid overlapping.
              return (
                <text
                  key={zone.text}
                  x={p.x}
                  y={p.y + 16}
                  textAnchor={labelAnchor(zone.value)}
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[8px] font-semibold uppercase tracking-wider"
                >
                  {zone.text}
                </text>
              );
            })}
          </>
        )}

        {value !== null && !loading && (
          <g transform={`rotate(${needleRotation} ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y})`}>
            <polygon
              points={`${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X},${GAUGE_CENTER_Y - 72} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y + 15} ${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y + 15}`}
              className="fill-foreground"
            />
            <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={6} className="fill-foreground" />
            <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={2.5} className="fill-background" />
          </g>
        )}
      </svg>
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
    </div>
  );
}
