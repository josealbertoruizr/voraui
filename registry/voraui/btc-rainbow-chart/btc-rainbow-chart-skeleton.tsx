"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BtcRainbowChartSkeletonProps {
  className?: string;
}

const PRESET_COUNT = 4;
const STRIPE_COUNT = 6;

export function BtcRainbowChartSkeleton({ className }: BtcRainbowChartSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} role="status">
      <style href="voraui-btc-rainbow-chart-skeleton" precedence="low">{`
        @keyframes voraui-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: voraui-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="flex items-center justify-end gap-1">
        {Array.from({ length: PRESET_COUNT }, (_, i) => (
          <div key={i} className="h-7 w-10 rounded-md bg-muted" />
        ))}
      </div>
      <div className="voraui-skeleton-shimmer relative h-[360px] w-full overflow-hidden rounded-md bg-muted/30 sm:h-[420px]">
        {Array.from({ length: STRIPE_COUNT }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 bg-muted-foreground/10"
            style={{ top: `${(i / STRIPE_COUNT) * 100}%`, height: `${100 / STRIPE_COUNT}%` }}
          />
        ))}
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <polyline
            points="0,170 40,150 80,158 120,120 160,132 200,90 240,100 280,60 320,72 360,40 400,50"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-muted-foreground/30"
          />
        </svg>
      </div>
      <span className="sr-only">Loading BTC price history</span>
    </div>
  );
}
