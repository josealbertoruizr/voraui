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
  /** "full" shows the zone labels around the dial; "minimal" shows just the dial, needle, and number. */
  variant?: "full" | "minimal";
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

function labelAnchor(value: number): "start" | "middle" | "end" {
  if (value < 45) return "start";
  if (value > 55) return "end";
  return "middle";
}

export function FearGreedGauge({ data, variant = "full", className }: FearGreedGaugeProps) {
  const curveId = React.useId();
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
