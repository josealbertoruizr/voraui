"use client";

import { cn } from "@/lib/utils";

export interface AltseasonGaugeSkeletonProps {
  /** Matches AltseasonGaugeProps["variant"] so the ghost lines up with the real gauge. */
  variant?: "meter" | "bars";
  className?: string;
}

const BARS_GHOST_COUNT = 24;

export function AltseasonGaugeSkeleton({ variant = "meter", className }: AltseasonGaugeSkeletonProps) {
  return (
    <div
      role="status"
      className={cn("voraui-altseason-gauge-skeleton-shimmer relative flex flex-col gap-4 overflow-hidden", className)}
    >
      <style href="voraui-altseason-gauge-skeleton" precedence="low">{`
        @keyframes voraui-altseason-gauge-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-altseason-gauge-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: voraui-altseason-gauge-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-altseason-gauge-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="flex items-end gap-3">
        <div className="h-9 w-14 rounded-md bg-muted" />
        <div className="h-4 w-8 rounded bg-muted" />
        <div className="ml-auto h-6 w-24 rounded-full bg-muted" />
      </div>

      {variant === "bars" ? (
        <div className="flex flex-col gap-3">
          <div className="flex h-14 items-stretch gap-[3px]">
            {Array.from({ length: BARS_GHOST_COUNT }, (_, i) => (
              <div
                key={i}
                className={cn("flex-1 rounded-[2px] bg-muted", i % 2 === 0 ? "opacity-60" : "opacity-25")}
              />
            ))}
          </div>
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="h-3 w-full rounded-full bg-muted" />
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
      )}
      <span className="sr-only">Loading Altseason Index</span>
    </div>
  );
}
