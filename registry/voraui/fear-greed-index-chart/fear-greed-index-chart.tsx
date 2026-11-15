"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import type { UTCTimestamp } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FearGreedIndexChartSkeleton } from "./components/skeleton";
import { useFearGreedHistory } from "./hooks/use-fear-greed-history";
import { useBtcDaily } from "./hooks/use-btc-daily";
import { useIndexChart, type IndexPoint, type ValuePoint } from "./hooks/use-index-chart";
import {
  clipToRange,
  normalizeByTime,
  toIndexLineData,
  type BtcDailyPoint,
  type FearGreedPoint,
} from "./lib/fear-greed-bands";
import type { Preset } from "./lib/chart-range";

export interface FearGreedIndexChartProps {
  /** Draw the BTC price line on the left scale. */
  showPrice?: boolean;
  /** Draw the BTC volume histogram along the bottom. */
  showVolume?: boolean;
  /** Provide your own index series to bypass the alternative.me fetcher. */
  data?: FearGreedPoint[];
  /** Provide your own BTC series to bypass the Binance fetcher. */
  btcData?: BtcDailyPoint[];
  className?: string;
}

const PRESETS: Preset[] = ["30D", "1Y", "ALL"];
const INDEX_LEGEND_COLOR = "#f0c929";

/** Crypto Fear & Greed index history as a band-colored line with optional BTC price and volume. */
export function FearGreedIndexChart({
  showPrice = true,
  showVolume = false,
  data,
  btcData,
  className,
}: FearGreedIndexChartProps) {
  const { resolvedTheme } = useTheme();
  const fetched = useFearGreedHistory({ enabled: data === undefined });
  // Fetched history is already normalized by its parser.
  const index = useMemo(
    () => (data ? normalizeByTime(data) : (fetched.data ?? [])),
    [data, fetched.data],
  );
  const loading = data === undefined && fetched.loading;
  const error = data === undefined ? fetched.error : null;

  const btcWanted = showPrice || showVolume;
  const firstIndexTime = index[0]?.time;
  const lastIndexTime = index[index.length - 1]?.time;
  const fetchedBtc = useBtcDaily({
    enabled: btcWanted && btcData === undefined,
    from: firstIndexTime ?? null,
  });
  const btc = useMemo(() => {
    if (!btcWanted || firstIndexTime === undefined || lastIndexTime === undefined) return [];
    const source = btcData ?? fetchedBtc.data ?? [];
    return clipToRange(normalizeByTime(source), firstIndexTime, lastIndexTime);
  }, [btcWanted, btcData, fetchedBtc.data, firstIndexTime, lastIndexTime]);

  const indexLine = useMemo<IndexPoint[]>(
    () => toIndexLineData(index).map((p) => ({ ...p, time: p.time as UTCTimestamp })),
    [index],
  );
  const priceLine = useMemo<ValuePoint[]>(
    () =>
      btc
        .filter((p) => Number.isFinite(p.price) && p.price > 0)
        .map((p) => ({ time: p.time as UTCTimestamp, value: p.price })),
    [btc],
  );
  const volumeBars = useMemo<ValuePoint[]>(
    () =>
      btc
        .filter((p) => Number.isFinite(p.volume) && p.volume >= 0)
        .map((p) => ({ time: p.time as UTCTimestamp, value: p.volume })),
    [btc],
  );

  const hasIndex = indexLine.length > 0;
  const drawPrice = showPrice && priceLine.length > 0;
  const drawVolume = showVolume && volumeBars.length > 0;
  // Holding the price scale open while BTC loads keeps the plot from narrowing when it lands.
  const reservePriceScale = drawPrice || (showPrice && fetchedBtc.loading);

  const [preset, setPreset] = useState<Preset>("ALL");
  const {
    containerRef,
    failed: chartFailed,
    refit,
  } = useIndexChart({
    indexLine,
    priceLine,
    volumeBars,
    drawPrice,
    drawVolume,
    reservePriceScale,
    theme: resolvedTheme,
    preset,
  });

  if (loading) {
    return <FearGreedIndexChartSkeleton className={className} />;
  }

  if (!hasIndex || chartFailed) {
    return (
      <div
        role="alert"
        className={cn(
          "flex h-[220px] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground",
          className,
        )}
      >
        Fear &amp; Greed history is unavailable{error ? ` (${error})` : ""}.
      </div>
    );
  }

  return (
    <div className={cn("@container space-y-2", className)}>
      <div className="flex flex-col items-start gap-2 @lg:flex-row @lg:items-center @lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <LegendEntry label="Fear & Greed Index" dotStyle={{ backgroundColor: INDEX_LEGEND_COLOR }} />
          {drawPrice && <LegendEntry label="Bitcoin Price" dotClassName="bg-muted-foreground" />}
          {drawVolume && <LegendEntry label="Bitcoin Volume" dotClassName="bg-muted-foreground/40" />}
        </div>
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={preset === p ? "default" : "outline"}
              className="h-7 px-2.5 text-[11px] font-medium"
              // Clicking the active preset snaps a zoomed or panned view back to it.
              onClick={() => {
                if (p === preset) refit();
                else setPreset(p);
              }}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className={cn("relative h-[360px] w-full overflow-hidden sm:h-[420px]", "[&_canvas]:!touch-pan-y")}
      />
    </div>
  );
}

function LegendEntry({
  label,
  dotClassName,
  dotStyle,
}: {
  label: string;
  dotClassName?: string;
  dotStyle?: { backgroundColor: string };
}) {
  return (
    <div className="flex h-4 items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} style={dotStyle} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
