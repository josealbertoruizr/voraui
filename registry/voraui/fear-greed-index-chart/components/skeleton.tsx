"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface FearGreedIndexChartSkeletonProps {
  className?: string;
}

const PRESET_COUNT = 3;
const LEGEND_WIDTHS = ["w-16", "w-20"];
const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 200;
const LINE_POINTS = 70;
const FEAR_COLOR = "#c0392b";
const GREED_COLOR = "#2e7d32";
const ZONE_OPACITY = 0.1;

/** Deterministic wavy index line; Math.random would cause a hydration mismatch. */
function indexLinePoints(): string {
  const points: string[] = [];
  for (let i = 0; i < LINE_POINTS; i++) {
    const x = (i / (LINE_POINTS - 1)) * VIEW_WIDTH;
    const y =
      VIEW_HEIGHT / 2 +
      Math.sin(i * 0.22) * 38 +
      Math.sin(i * 0.67) * 14 +
      Math.sin(i * 1.9) * 4;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

export function FearGreedIndexChartSkeleton({ className }: FearGreedIndexChartSkeletonProps) {
  const linePoints = useMemo(() => indexLinePoints(), []);
  const zoneHeight = VIEW_HEIGHT / 4;

  return (
    <div className={cn("@container space-y-2", className)} role="status">
      <span className="sr-only">Loading Fear &amp; Greed history</span>
      <style href="voraui-fear-greed-index-chart-skeleton" precedence="low">{`
        @keyframes voraui-fear-greed-index-chart-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-fear-greed-index-chart-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: voraui-fear-greed-index-chart-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-fear-greed-index-chart-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="flex flex-col items-start gap-2 @lg:flex-row @lg:items-center @lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {LEGEND_WIDTHS.map((width) => (
            <div key={width} className="flex h-4 items-center gap-1.5">
              <div className="size-2 rounded-full bg-muted" />
              <div className={cn("h-3 rounded bg-muted", width)} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: PRESET_COUNT }, (_, i) => (
            <div key={i} className="h-7 w-10 rounded-md bg-muted" />
          ))}
        </div>
      </div>
      <div className="voraui-fear-greed-index-chart-skeleton-shimmer relative h-[360px] w-full overflow-hidden rounded-md bg-muted/30 sm:h-[420px]">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <rect x={0} y={0} width={VIEW_WIDTH} height={zoneHeight} fill={GREED_COLOR} opacity={ZONE_OPACITY} />
          <rect
            x={0}
            y={VIEW_HEIGHT - zoneHeight}
            width={VIEW_WIDTH}
            height={zoneHeight}
            fill={FEAR_COLOR}
            opacity={ZONE_OPACITY}
          />
          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="text-muted-foreground/55"
          />
        </svg>
      </div>
    </div>
  );
}
