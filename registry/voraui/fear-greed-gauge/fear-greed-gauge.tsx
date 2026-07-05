"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFearGreed, type FearGreedData } from "./use-fear-greed";

export interface FearGreedGaugeProps {
  /** Provide your own data to bypass the bundled alternative.me fetcher. */
  data?: FearGreedData;
  className?: string;
}

export function FearGreedGauge({ data, className }: FearGreedGaugeProps) {
  const fetched = useFearGreed({ enabled: data === undefined });
  const resolved = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const value = resolved?.value ?? null;
  const label = resolved?.label ?? (fetched.error ? "Data unavailable" : "Unknown");
  const angle = ((value ?? 50) / 100) * 180 - 90;

  return (
    <div className={cn("relative flex flex-col items-center pt-2", className)}>
      <svg viewBox="0 0 200 110" className="w-full max-w-[260px]" aria-hidden="true">
        <defs>
          <linearGradient id="voraui-fg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#voraui-fg-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {value !== null && !loading && (
          <g transform={`rotate(${angle} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="34"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-foreground"
            />
            <circle cx="100" cy="100" r="5" className="fill-foreground" />
          </g>
        )}
      </svg>
      <div className="-mt-3 text-center">
        {loading ? (
          <div role="status">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading Fear &amp; Greed Index</span>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold tabular-nums text-foreground">{value ?? "—"}</p>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          </>
        )}
      </div>
      <div className="mt-3 flex w-full max-w-[260px] justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Fear</span>
        <span>Greed</span>
      </div>
    </div>
  );
}
