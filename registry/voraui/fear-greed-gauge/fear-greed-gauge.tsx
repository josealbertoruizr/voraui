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
  angleForValue,
  arcPoint,
  describeArc,
} from "./fear-greed-bands";

export interface FearGreedGaugeProps {
  /** Provide your own data to bypass the bundled alternative.me fetcher. */
  data?: FearGreedData;
  /** "full" shows tick numbers and zone labels; "minimal" shows just the dial, needle, and number. */
  variant?: "full" | "minimal";
  className?: string;
}

const NUMERIC_TICKS = [0, 20, 40, 50, 60, 80, 100];
const MINOR_TICKS = Array.from({ length: 21 }, (_, i) => i * 5).filter(
  (v) => !NUMERIC_TICKS.includes(v),
);
const ZONE_LABELS: Array<{ value: number; text: string }> = [
  { value: 0, text: "EXTREME FEAR" },
  { value: 22, text: "FEAR" },
  { value: 50, text: "NEUTRAL" },
  { value: 78, text: "GREED" },
  { value: 100, text: "EXTREME GREED" },
];

function labelAnchor(value: number): "start" | "middle" | "end" {
  if (value < 45) return "start";
  if (value > 55) return "end";
  return "middle";
}

export function FearGreedGauge({ data, variant = "full", className }: FearGreedGaugeProps) {
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
        {DEFAULT_FEAR_GREED_BANDS.map((band) => (
          <path
            key={band.key}
            d={describeArc(90, band.min, band.max)}
            fill="none"
            stroke={band.color}
            strokeWidth={12}
            strokeLinecap="round"
          />
        ))}

        {variant === "full" && (
          <>
            {MINOR_TICKS.map((v) => {
              const inner = arcPoint(98, v);
              const outer = arcPoint(103, v);
              return (
                <line
                  key={`minor-${v}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  strokeWidth={1}
                  className="stroke-muted-foreground/30"
                />
              );
            })}
            {NUMERIC_TICKS.map((v) => {
              const inner = arcPoint(96, v);
              const outer = arcPoint(106, v);
              return (
                <line
                  key={`major-${v}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  strokeWidth={1.5}
                  className="stroke-muted-foreground/60"
                />
              );
            })}
            {NUMERIC_TICKS.map((v) => {
              const p = arcPoint(114, v);
              return (
                <text
                  key={`num-${v}`}
                  x={p.x}
                  y={p.y}
                  textAnchor={labelAnchor(v)}
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[9px] font-medium tabular-nums"
                >
                  {v}
                </text>
              );
            })}
            {ZONE_LABELS.map((zone) => {
              const p = arcPoint(126, zone.value);
              // The 0/100 zone labels sit on the same baseline as the "0"/"100"
              // numeric ticks (both endpoints have the same y at this radius),
              // so push them down onto their own line to avoid overlapping.
              const isEdge = zone.value === 0 || zone.value === 100;
              return (
                <text
                  key={zone.text}
                  x={p.x}
                  y={isEdge ? p.y + 16 : p.y}
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
            <line
              x1={GAUGE_CENTER_X}
              y1={GAUGE_CENTER_Y}
              x2={GAUGE_CENTER_X}
              y2={GAUGE_CENTER_Y - 72}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="text-foreground"
            />
            <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={4} className="fill-foreground" />
          </g>
        )}
      </svg>
      <div className="-mt-10 text-center">
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
