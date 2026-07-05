"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
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
      {/* Score number + label, read together as a unit */}
      <div className="flex items-end gap-3">
        <p className="text-4xl font-bold leading-none tabular-nums text-foreground">
          {hasScore ? Math.round(resolved.score as number) : "—"}
        </p>
        <p className="pb-1 text-xs text-muted-foreground">/ 100</p>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            isBtc && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            isAlt && "bg-violet-500/15 text-violet-600 dark:text-violet-400",
            !isBtc && !isAlt && "bg-muted text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>

      {hasScore ? (
        <>
          {/* Horizontal gradient bar with vertical cursor marker */}
          <div className="relative pt-3">
            <div
              className="h-2.5 w-full rounded-full"
              style={{
                background:
                  "linear-gradient(to right, #f59e0b 0%, #f59e0b 22%, #d4d4d8 28%, #d4d4d8 72%, #8b5cf6 78%, #8b5cf6 100%)",
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Outperforming BTC
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                {resolved.outperforming} / {resolved.compared}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                BTC {resolved.window}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm font-semibold tabular-nums",
                  (resolved.btcChangePct ?? 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400",
                )}
              >
                {resolved.btcChangePct !== null
                  ? `${resolved.btcChangePct > 0 ? "+" : ""}${resolved.btcChangePct.toFixed(2)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-[120px] items-center justify-center">
          <p className="text-xs text-muted-foreground">Altseason score is unavailable.</p>
        </div>
      )}
    </div>
  );
}
