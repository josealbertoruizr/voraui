"use client";

import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { AltseasonGaugeSkeleton } from "./components/skeleton";
import { useAltseason } from "./hooks/use-altseason";
import type { AltseasonData, AltseasonWindow } from "./lib/altseason";

export interface AltseasonGaugeProps {
  /** Provide your own data to bypass the bundled CoinPaprika fetcher. */
  data?: AltseasonData;
  /** Comparison window for the bundled fetcher. Ignored when data is set. */
  window?: AltseasonWindow;
  /** "meter" (default) three-zone track with a thumb; "bars" one bar per compared altcoin. */
  variant?: "meter" | "bars";
  /** Spring the thumb in from center on first render instead of snapping. */
  animateOnLoad?: boolean;
  className?: string;
}

// Bars fallback when custom data has a score but no per-coin counts.
const BARS_FALLBACK_TOTAL = 50;

// Classic altseason spectrum (blockchaincenter.net): amber BTC pole, blue
// mixed center, red alt pole. Both variants draw from this one ramp.
const SEASON_RAMP_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0, rgb: [245, 158, 11] },
  { t: 0.25, rgb: [250, 204, 21] },
  { t: 0.4, rgb: [74, 222, 128] },
  { t: 0.5, rgb: [56, 189, 248] },
  { t: 0.6, rgb: [74, 222, 128] },
  { t: 0.75, rgb: [250, 204, 21] },
  { t: 0.88, rgb: [245, 158, 11] },
  { t: 1, rgb: [239, 68, 68] },
];

const TRACK_GRADIENT = `linear-gradient(to right, ${SEASON_RAMP_STOPS.map(
  (s) => `rgb(${s.rgb.join(" ")}) ${s.t * 100}%`,
).join(", ")})`;

function seasonRampColor(t: number): string {
  for (let i = 0; i < SEASON_RAMP_STOPS.length - 1; i++) {
    const from = SEASON_RAMP_STOPS[i];
    const to = SEASON_RAMP_STOPS[i + 1];
    if (t >= from.t && t <= to.t) {
      const k = (t - from.t) / (to.t - from.t);
      const [r, g, b] = from.rgb.map((c, ch) => Math.round(c + (to.rgb[ch] - c) * k));
      return `rgb(${r} ${g} ${b})`;
    }
  }
  const [r, g, b] = SEASON_RAMP_STOPS[SEASON_RAMP_STOPS.length - 1].rgb;
  return `rgb(${r} ${g} ${b})`;
}

export function AltseasonGauge({
  data,
  window: windowProp = "7d",
  variant = "meter",
  animateOnLoad = true,
  className,
}: AltseasonGaugeProps) {
  const fetched = useAltseason(windowProp, { enabled: data === undefined });
  const resolved = data ?? fetched.data;

  if (!resolved) {
    if (fetched.error) {
      return (
        <div className={cn("flex h-[180px] items-center justify-center", className)}>
          <p role="alert" className="text-xs text-muted-foreground">Altseason data is unavailable.</p>
        </div>
      );
    }
    return <AltseasonGaugeSkeleton variant={variant} className={className} />;
  }

  const hasScore = resolved.score !== null;
  const score = resolved.score ?? 50;
  // Edge padding so a 0/100 score doesn't push the thumb half-off the track.
  const markerLeft = Math.min(Math.max(score, 3), 97);
  const label = resolved.label;
  const isBtc = label === "Bitcoin Season";
  const isAlt = label === "Altcoin Season";
  const isMixed = label === "Mixed";

  const barsTotal = resolved.compared > 0 ? resolved.compared : BARS_FALLBACK_TOTAL;
  const barsFilled =
    resolved.compared > 0
      ? Math.min(resolved.outperforming, barsTotal)
      : Math.round((score / 100) * BARS_FALLBACK_TOTAL);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-end gap-3">
        <p className="text-4xl font-bold leading-none tabular-nums text-foreground">
          {hasScore ? <NumberFlow value={Math.round(resolved.score as number)} /> : "-"}
        </p>
        <p className="pb-1 text-xs text-muted-foreground">/ 100</p>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            isBtc && "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
            isAlt && "bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-300",
            isMixed && "bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
            !isBtc && !isAlt && !isMixed && "bg-muted text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>

      {!hasScore ? (
        <div className="flex h-[120px] items-center justify-center">
          <p className="text-xs text-muted-foreground">Altseason score is unavailable.</p>
        </div>
      ) : variant === "bars" ? (
        <div className="flex flex-col gap-3">
          <div
            className="flex h-14 items-stretch gap-[3px]"
            role="img"
            aria-label={`${barsFilled} of ${barsTotal} altcoins outperforming Bitcoin`}
          >
            {Array.from({ length: barsTotal }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-[2px] transition-opacity duration-200",
                  i < barsFilled ? "opacity-100" : "opacity-25",
                )}
                style={{ backgroundColor: seasonRampColor(barsTotal > 1 ? i / (barsTotal - 1) : 0) }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{barsFilled}</span> of{" "}
            <span className="tabular-nums">{barsTotal}</span> top alts outperforming BTC
            {resolved.compared > 0 && <> &middot; {resolved.window}</>}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <div
              className="h-3 w-full rounded-full"
              style={{ background: TRACK_GRADIENT }}
              aria-hidden="true"
            />
            <motion.div
              className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={animateOnLoad ? { left: "50%" } : false}
              animate={{ left: `${markerLeft}%` }}
              transition={{ type: "spring", stiffness: 100 }}
              aria-hidden
            >
              <div className="h-6 w-1 rounded-full bg-foreground ring-1 ring-background" />
            </motion.div>
          </div>
          <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className={cn(isBtc && "text-amber-600 dark:text-amber-300")}>BTC season</span>
            <span className={cn(isMixed && "text-sky-600 dark:text-sky-300")}>Mixed</span>
            <span className={cn(isAlt && "text-red-600 dark:text-red-300")}>Altseason</span>
          </div>
        </div>
      )}
    </div>
  );
}
