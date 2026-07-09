"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FEAR_GREED_BANDS,
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  WEDGE_GAP,
  WEDGE_HUB_RADIUS,
  WEDGE_INNER_RADIUS,
  WEDGE_OUTER_RADIUS,
  WEDGES_VIEWBOX_HEIGHT,
  describeArc,
  describeWedge,
} from "./fear-greed-bands";

export interface FearGreedGaugeSkeletonProps {
  /** Matches FearGreedGaugeProps["variant"] so the ghost lines up with the real dial. */
  variant?: "minimal" | "ticks" | "gradient" | "wedges";
  className?: string;
}

const WEDGE_COUNT = DEFAULT_FEAR_GREED_BANDS.length;

export function FearGreedGaugeSkeleton({ variant = "gradient", className }: FearGreedGaugeSkeletonProps) {
  const isWedges = variant === "wedges";

  return (
    <div
      role="status"
      className={cn("voraui-skeleton-shimmer relative flex flex-col items-center overflow-hidden", className)}
    >
      <style href="voraui-fear-greed-gauge-skeleton" precedence="low">{`
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
      <div className="relative w-full max-w-[300px]">
        <svg
          viewBox={isWedges ? `0 0 260 ${WEDGES_VIEWBOX_HEIGHT}` : "0 0 260 158"}
          className="w-full"
          aria-hidden="true"
        >
          {isWedges ? (
            Array.from({ length: WEDGE_COUNT }, (_, i) => {
              const share = 100 / WEDGE_COUNT;
              const from = i * share + WEDGE_GAP;
              const to = (i + 1) * share - WEDGE_GAP;
              return (
                <path
                  key={i}
                  d={describeWedge(WEDGE_OUTER_RADIUS, WEDGE_INNER_RADIUS, from, to)}
                  className="fill-muted"
                />
              );
            })
          ) : (
            <path
              d={describeArc(90, 0, 100)}
              fill="none"
              stroke="currentColor"
              strokeWidth={12}
              strokeLinecap="round"
              className="text-muted"
            />
          )}
          <polygon
            points={`${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X},${GAUGE_CENTER_Y - 72} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y + 15} ${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y + 15}`}
            className="fill-muted-foreground/40"
          />
          {isWedges && (
            <circle
              cx={GAUGE_CENTER_X}
              cy={GAUGE_CENTER_Y}
              r={WEDGE_HUB_RADIUS}
              strokeWidth={1}
              className="fill-background stroke-border"
            />
          )}
        </svg>
        {isWedges && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${(GAUGE_CENTER_Y / WEDGES_VIEWBOX_HEIGHT) * 100}%` }}
          >
            <div className="mx-auto h-9 w-14 rounded-md bg-muted" />
          </div>
        )}
      </div>
      {!isWedges && (
        <div className="-mt-4 flex flex-col items-center">
          <div className="h-9 w-16 rounded-md bg-muted" />
          <div className="h-4 w-20 rounded-full bg-muted" />
        </div>
      )}
      <span className="sr-only">Loading Fear &amp; Greed Index</span>
    </div>
  );
}
