"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TradingChartSkeletonProps {
  className?: string;
  /** Matches TradingChartProps["height"]. */
  height?: number;
}

export interface GhostCandle {
  up: boolean;
  bodyHeightPct: number;
  wickHeightPct: number;
}

const GHOST_CANDLE_COUNT = 48;

/** Deterministic placeholder candle heights (0-100 percent of the ghost row's
 *  max height) so server and client renders match exactly - Math.random here
 *  would produce a hydration mismatch. */
export function generateGhostCandles(count: number): GhostCandle[] {
  return Array.from({ length: count }, (_, i) => {
    const bodyHeightPct = 25 + 35 * Math.abs(Math.sin(i * 0.7));
    const wickHeightPct = Math.min(bodyHeightPct + 12 + (i % 3) * 4, 100);
    return { up: i % 2 === 0, bodyHeightPct, wickHeightPct };
  });
}

export function TradingChartSkeleton({ className, height = 500 }: TradingChartSkeletonProps) {
  const candles = React.useMemo(() => generateGhostCandles(GHOST_CANDLE_COUNT), []);

  return (
    <div
      role="status"
      className={cn("voraui-trading-chart-skeleton-shimmer relative w-full overflow-hidden rounded-xl bg-card", className)}
      style={{ height }}
    >
      <style href="voraui-trading-chart-skeleton" precedence="low">{`
        @keyframes voraui-trading-chart-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-trading-chart-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          animation: voraui-trading-chart-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-trading-chart-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="absolute inset-0 flex items-end gap-[2px] px-3 pb-8 pt-4">
        {candles.map((candle, i) => (
          <div key={i} className="relative flex-1" style={{ height: `${candle.wickHeightPct}%` }}>
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-muted-foreground/20" />
            <div
              className={cn(
                "absolute left-1/2 w-full max-w-[6px] -translate-x-1/2 rounded-[1px]",
                candle.up ? "bg-emerald-500/15" : "bg-rose-500/15",
              )}
              style={{
                height: `${candle.bodyHeightPct}%`,
                top: `${(candle.wickHeightPct - candle.bodyHeightPct) / 2}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="absolute right-0 top-0 flex h-full w-12 flex-col justify-between gap-2 bg-background/30 py-4 pr-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-2 w-8 self-end rounded bg-muted-foreground/15" />
        ))}
      </div>
      <span className="sr-only">Loading market data</span>
    </div>
  );
}
