"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_RAINBOW_BANDS } from "../lib/rainbow-bands";

export interface BtcRainbowChartSkeletonProps {
  className?: string;
}

const PRESET_COUNT = 4;
const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 200;
const CURVE_STEPS = 24;
const PRICE_LINE_POINTS = 70;

// Ceiling y per band at x=0 (compressed) and x=VIEW_WIDTH (fanned out),
// top to bottom; mirrors the live chart's log-regression fan shape.
const BOUNDARY_Y0 = [150, 154, 158, 162, 166, 170, 174, 178, 182];
const BOUNDARY_Y1 = [14, 36, 58, 80, 102, 124, 146, 168, 190];

function boundaryPoints(index: number): [number, number][] {
  const points: [number, number][] = [];
  for (let s = 0; s <= CURVE_STEPS; s++) {
    const t = s / CURVE_STEPS;
    const x = t * VIEW_WIDTH;
    const curve = Math.log10(1 + 9 * t); // 0 at t=0, 1 at t=1
    const y = BOUNDARY_Y0[index] + (BOUNDARY_Y1[index] - BOUNDARY_Y0[index]) * curve;
    points.push([x, y]);
  }
  return points;
}

function pointsAttr(points: [number, number][]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

/** Deterministic wavy price line; Math.random would cause a hydration mismatch. */
function pricePoints(): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < PRICE_LINE_POINTS; i++) {
    const t = i / (PRICE_LINE_POINTS - 1);
    const x = t * VIEW_WIDTH;
    const curve = Math.log10(1 + 9 * t);
    // Drifts from the b7 boundary toward b4, like BTC's real path.
    const trend = BOUNDARY_Y0[6] + (BOUNDARY_Y1[3] - BOUNDARY_Y0[6]) * curve;
    const noise = Math.sin(i * 1.3) * 5 + Math.sin(i * 0.47) * 9 + Math.sin(i * 2.9) * 2.2;
    points.push([x, trend + noise]);
  }
  return points;
}

export function BtcRainbowChartSkeleton({ className }: BtcRainbowChartSkeletonProps) {
  const bandFills = useMemo(() => {
    const boundaries = DEFAULT_RAINBOW_BANDS.map((_, i) => boundaryPoints(i));
    return DEFAULT_RAINBOW_BANDS.slice(0, -1).map((_, i) => ({
      color: DEFAULT_RAINBOW_BANDS[i + 1].color,
      points: pointsAttr(boundaries[i].concat([...boundaries[i + 1]].reverse())),
    }));
  }, []);

  const pricePath = useMemo(() => pointsAttr(pricePoints()), []);

  return (
    <div className={cn("space-y-2", className)} role="status">
      <span className="sr-only">Loading BTC price history</span>
      <style href="voraui-btc-rainbow-chart-skeleton" precedence="low">{`
        @keyframes voraui-btc-rainbow-chart-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-btc-rainbow-chart-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: voraui-btc-rainbow-chart-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-btc-rainbow-chart-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="flex items-center justify-end gap-1">
        {Array.from({ length: PRESET_COUNT }, (_, i) => (
          <div key={i} className="h-7 w-10 rounded-md bg-muted" />
        ))}
      </div>
      <div className="voraui-btc-rainbow-chart-skeleton-shimmer relative h-[360px] w-full overflow-hidden rounded-md bg-muted/30 sm:h-[420px]">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {bandFills.map((band, i) => (
            <polygon key={i} points={band.points} fill={band.color} opacity={0.22} />
          ))}
          <polyline
            points={pricePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-muted-foreground/55"
          />
        </svg>
      </div>
    </div>
  );
}
