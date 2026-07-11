"use client";

import { cn } from "@/lib/utils";
import { TradingChartSkeleton } from "./trading-chart-skeleton";
import type { TradingChartProps } from "./trading-chart-types";
import { useKlines } from "./use-klines";
import { useChartInstance } from "./use-chart-instance";
import { useChartTheme } from "./use-chart-theme";
import { useChartData } from "./use-chart-data";
import { useLiveCandles } from "./use-live-candles";
import { useBoundaryNotification } from "./use-boundary-notification";

function TradingChart({
  symbol = "BTCUSDT",
  timeframe = "1h",
  trades = [],
  candles: candlesProp,
  live = true,
  height = 500,
  limit = 500,
  showTooltips = true,
  className,
}: TradingChartProps) {
  const hasOverrideCandles = candlesProp !== undefined;

  const { candles, setCandles, loading, error, fetchMore, hasMoreHistory } = useKlines(
    symbol,
    timeframe,
    { limit, enabled: !hasOverrideCandles },
  );

  const effectiveCandles = candlesProp ?? candles;

  const { containerRef, stateRef, chartEpoch } = useChartInstance({
    symbol,
    height,
    candles: effectiveCandles,
    trades,
    timeframe,
    showTooltips,
    loading,
    hasOverrideCandles,
    // With prop-supplied candles there is no more history to fetch.
    hasMoreHistory: hasOverrideCandles ? false : hasMoreHistory,
    fetchMore,
  });

  useChartTheme(stateRef);

  useChartData({ stateRef, chartEpoch, candles: effectiveCandles, trades, symbol, timeframe });

  useLiveCandles({
    stateRef,
    symbol,
    timeframe,
    enabled: live && !hasOverrideCandles,
    setCandles,
  });

  const showNoMoreData = useBoundaryNotification({
    hasMoreHistory,
    loading,
    candlesCount: candles.length,
    hasOverrideCandles,
    symbol,
    timeframe,
  });

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-card", className)}>
      {loading && effectiveCandles.length === 0 && (
        <TradingChartSkeleton height={height} className="absolute inset-0 z-50" />
      )}

      {error && effectiveCandles.length === 0 && !loading && (
        <div role="alert" className="absolute inset-0 z-50 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Market data is unavailable ({error}).</p>
        </div>
      )}

      {showNoMoreData && (
        <div className="absolute left-3 top-3 z-40 duration-300 animate-in fade-in slide-in-from-left-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur-sm">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
              No more historical data
            </span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative w-full" style={{ height }} />
    </div>
  );
}

export { TradingChart };
