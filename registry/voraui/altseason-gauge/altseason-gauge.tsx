"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { useAltseason } from "./use-altseason";
import type { AltseasonData, AltseasonWindow } from "./altseason";

export interface AltseasonGaugeProps {
  /** Provide your own data to bypass the bundled CoinPaprika fetcher. */
  data?: AltseasonData;
  /** Comparison window for the bundled fetcher. Ignored when data is set. */
  window?: AltseasonWindow;
  className?: string;
}

export function AltseasonGauge({ data, window: windowProp = "7d", className }: AltseasonGaugeProps) {
  const fetched = useAltseason(windowProp, { enabled: data === undefined });
  const resolved = data ?? fetched.data;

  if (!resolved) {
    return (
      <div className={cn("flex h-[180px] items-center justify-center", className)}>
        {fetched.error ? (
          <p role="alert" className="text-xs text-muted-foreground">Altseason data is unavailable.</p>
        ) : (
          <div role="status">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading Altseason Index</span>
          </div>
        )}
      </div>
    );
  }

  const hasScore = resolved.score !== null;
  const score = resolved.score ?? 50;
  // Clamp marker position with edge padding so a score of 0 / 100 doesn't
  // place the marker half-off the bar and visually collide with the zone
  // labels sitting below.
  const markerLeft = Math.min(Math.max(score, 3), 97);
  const label = resolved.label;
  const isBtc = label === "Bitcoin Season";
  const isAlt = label === "Altcoin Season";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-end gap-3">
        <p className="text-4xl font-bold leading-none tabular-nums text-foreground">
          {hasScore ? <NumberFlow value={Math.round(resolved.score as number)} /> : "—"}
        </p>
        <p className="pb-1 text-xs text-muted-foreground">/ 100</p>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            isBtc && "bg-amber-800/10 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
            isAlt && "bg-violet-700/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
            !isBtc && !isAlt && "bg-muted text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>

      {hasScore ? (
        <div className="relative pt-3">
          <div
            className="h-2.5 w-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, #92400e 0%, #92400e 25%, #71717a 25%, #71717a 75%, #6d28d9 75%, #6d28d9 100%)",
            }}
          />
          <motion.div
            className="pointer-events-none absolute -top-1 bottom-0 -translate-x-1/2"
            initial={{ left: "50%" }}
            animate={{ left: `${markerLeft}%` }}
            transition={{ type: "spring", stiffness: 100 }}
            aria-hidden
          >
            <div className="absolute left-1/2 top-3 h-[18px] w-px -translate-x-1/2 bg-foreground" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none text-background shadow-sm">
              {Math.round(resolved.score as number)}
            </div>
          </motion.div>
          <div className="mt-4 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>BTC season</span>
            <span>Mixed</span>
            <span>Altseason</span>
          </div>
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center">
          <p className="text-xs text-muted-foreground">Altseason score is unavailable.</p>
        </div>
      )}
    </div>
  );
}
