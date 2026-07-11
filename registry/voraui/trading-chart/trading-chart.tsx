"use client";

import * as React from "react";
import { forwardRef, useImperativeHandle } from "react";
import { TradingChartSkeleton } from "./trading-chart-skeleton";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type {
  OhlcvCandle,
  TradeSide,
  TradingChartHandle,
  TradingChartProps,
} from "./trading-chart-types";
import { sanitizeCandles, isValidCandle } from "./candle-validation";
import { useKlines, useLatestCandlePolling } from "./use-klines";
import { alignSignalsToBars, buildSeriesMarkers, BUY_COLOR, SELL_COLOR } from "./markers";
import { normalizeToSeconds, toChartTime } from "./chart-time";
import { createTradeGlow, type TradeGlow } from "./trade-glow";
import { createSignalTooltip, type SignalTooltip } from "./signal-tooltip";

const TradingChart = forwardRef<TradingChartHandle, TradingChartProps>(function TradingChart(
  {
    symbol = "BTCUSDT",
    timeframe = "1h",
    trades = [],
    candles: candlesProp,
    live = true,
    height = 500,
    limit = 500,
    showTooltips = true,
    className,
  },
  ref,
) {
  const { resolvedTheme } = useTheme();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lightweight-charts's chart instance is only available via dynamic import; typing this precisely would force an eager import.
  const chartRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see chartRef above.
  const seriesRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see chartRef above.
  const markersPluginRef = React.useRef<any>(null);
  const glowRef = React.useRef<TradeGlow | null>(null);
  const tooltipRef = React.useRef<SignalTooltip | null>(null);

  const isAutoFitDoneRef = React.useRef(false);
  const lastCandlesLengthRef = React.useRef(0);
  const lastKeyRef = React.useRef(`${symbol}-${timeframe}`);
  const lastClosedTimeRef = React.useRef<number>(0);
  const isResettingRef = React.useRef(false);

  const { candles, setCandles, loading, error, fetchMore, hasMoreHistory } = useKlines(symbol, timeframe, {
    limit,
    enabled: candlesProp === undefined,
  });

  // If candles are supplied via props, render them instead of the fetched ones.
  const effectiveCandles = candlesProp ?? candles;

  // Latest values for the imperative chart event handlers, which outlive any
  // single render and must not observe stale closures.
  const latestRef = React.useRef({
    candles: effectiveCandles,
    trades,
    timeframe: timeframe as string,
    showTooltips,
    loading,
    hasOverrideCandles: candlesProp !== undefined,
    hasMoreHistory,
    fetchMore,
  });
  React.useEffect(() => {
    latestRef.current = {
      candles: effectiveCandles,
      trades,
      timeframe,
      showTooltips,
      loading,
      hasOverrideCandles: candlesProp !== undefined,
      // With prop-supplied candles there is no more history to fetch.
      hasMoreHistory: candlesProp !== undefined ? false : hasMoreHistory,
      fetchMore,
    };
  });

  React.useEffect(() => {
    if (!showTooltips) tooltipRef.current?.hide();
  }, [showTooltips]);

  useImperativeHandle(ref, () => ({
    highlightTrade: (timestampMs: number, price: number, side: TradeSide) =>
      glowRef.current?.highlight(timestampMs, price, side),
    clearHighlight: () => glowRef.current?.clear(),
  }));

  const [showNoMoreData, setShowNoMoreData] = React.useState(false);
  const noMoreDataTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chartEpoch, setChartEpoch] = React.useState(0);

  // Brief notification when the user hits the historical data boundary.
  React.useEffect(() => {
    if (!hasMoreHistory && !loading && candles.length > 0 && candlesProp === undefined) {
      setShowNoMoreData(true);
      if (noMoreDataTimerRef.current) clearTimeout(noMoreDataTimerRef.current);
      noMoreDataTimerRef.current = setTimeout(() => setShowNoMoreData(false), 4000);
    } else {
      setShowNoMoreData(false);
    }
    return () => {
      if (noMoreDataTimerRef.current) clearTimeout(noMoreDataTimerRef.current);
    };
  }, [hasMoreHistory, loading, candles.length, candlesProp]);

  const isLoadingMoreRef = React.useRef(false);
  // Set alongside isLoadingMoreRef, but consumed (and cleared) by the "Update
  // chart data" effect instead of the pagination handler's `finally` block.
  // isLoadingMoreRef flips back to false as soon as the fetch settles, which
  // happens before React has re-rendered with the prepended candles - by the
  // time that effect runs, isLoadingMoreRef is already false again, so the
  // view-shift correction below silently never fired. This ref's lifetime is
  // tied to "the next major-change update is a history-prepend that needs a
  // shift" instead of "a fetch is in flight", so it survives until read.
  const isPrependingHistoryRef = React.useRef(false);
  const oldestTimestampRef = React.useRef<number | null>(null);

  // Apply theme changes.
  React.useEffect(() => {
    if (!chartRef.current) return;
    const textColor = resolvedTheme === "dark" ? "#9CA3AF" : "#374151";
    const gridColor = resolvedTheme === "dark" ? "rgba(148,163,184,0.12)" : "rgba(0,0,0,0.05)";

    chartRef.current.applyOptions({
      layout: {
        background: { type: "solid", color: "rgba(0,0,0,0)" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
    });
  }, [resolvedTheme]);

  // Initialize chart.
  React.useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    let chartInitialized = false;

    const initChart = async (container: HTMLDivElement) => {
      const { createChart, CandlestickSeries, createSeriesMarkers, ColorType } = await import(
        "lightweight-charts"
      );
      if (disposed) return;

      const textColor = resolvedTheme === "dark" ? "#9CA3AF" : "#374151";
      const gridColor = resolvedTheme === "dark" ? "rgba(148,163,184,0.12)" : "rgba(0,0,0,0.05)";

      const chart = createChart(container, {
        width: container.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" },
          textColor,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        rightPriceScale: { borderVisible: false },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        crosshair: { mode: 0 },
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: BUY_COLOR,
        downColor: SELL_COLOR,
        borderUpColor: BUY_COLOR,
        borderDownColor: SELL_COLOR,
        wickUpColor: "#838ca1",
        wickDownColor: "#838ca1",
      });

      chartRef.current = chart;
      seriesRef.current = series;

      // Trade/indicator markers.
      markersPluginRef.current = createSeriesMarkers(series, []);

      // Trade highlight glow.
      const glow = createTradeGlow({
        container,
        getChart: () => chartRef.current,
        getSeries: () => seriesRef.current,
        getCandles: () => latestRef.current.candles,
        getTimeframe: () => latestRef.current.timeframe,
      });
      glowRef.current = glow;
      chart.timeScale().subscribeVisibleLogicalRangeChange(glow.updatePosition);

      // Hover tooltip for trade/indicator signals.
      const tooltip = createSignalTooltip({
        container,
        getCandles: () => latestRef.current.candles,
        getTrades: () => latestRef.current.trades,
        getTimeframe: () => latestRef.current.timeframe,
        isEnabled: () => latestRef.current.showTooltips,
      });
      tooltipRef.current = tooltip;
      chart.subscribeCrosshairMove(tooltip.onCrosshairMove);

      chart.timeScale().fitContent();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- logical range param shape from the dynamically-imported chart instance; see chartRef above.
      chart.timeScale().subscribeVisibleLogicalRangeChange(async (range: any) => {
        if (
          !range ||
          isLoadingMoreRef.current ||
          !oldestTimestampRef.current ||
          !latestRef.current.hasMoreHistory
        )
          return;

        // A range that spans the whole dataset is the initial fitContent (or
        // a full zoom-out), not a scroll toward history: its from is 0, which
        // would auto-fetch on load and balloon the caller's `limit` into
        // thousands of bars. Only paginate when some bars sit off-screen to
        // the right, i.e. the user actually moved toward the left edge.
        if (range.to >= latestRef.current.candles.length - 2) return;

        if (range.from < 50) {
          isLoadingMoreRef.current = true;
          try {
            const older = await latestRef.current.fetchMore(oldestTimestampRef.current);
            // Only flag the upcoming data-update effect run as a history-prepend
            // when candles were actually fetched (and therefore setCandles was
            // called). Otherwise there's no pending update to consume the flag,
            // and leaving it set would misattribute a later, unrelated change.
            isPrependingHistoryRef.current = Array.isArray(older) && older.length > 0;
          } finally {
            isLoadingMoreRef.current = false;
          }
        }
      });

      // Signal effects that a freshly initialized chart instance is ready for data.
      setChartEpoch((epoch) => epoch + 1);
    };

    if (containerRef.current) {
      ro = new ResizeObserver((entries) => {
        const { width, height: rectHeight } = entries[0].contentRect;
        if (width > 0 && rectHeight > 0 && !chartInitialized) {
          chartInitialized = true;
          initChart(containerRef.current!);
        } else if (width > 0 && chartInitialized && chartRef.current) {
          chartRef.current.applyOptions({ width });
        }
      });
      ro.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      if (ro) ro.disconnect();
      tooltipRef.current?.dispose();
      tooltipRef.current = null;
      glowRef.current?.dispose();
      glowRef.current = null;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
      markersPluginRef.current = null;
      lastCandlesLengthRef.current = 0;
      isAutoFitDoneRef.current = false;
    };
    // Only reinitialize if height changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Update chart data.
  React.useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    const key = `${symbol}-${timeframe}`;
    const keyChanged = lastKeyRef.current !== key;
    lastKeyRef.current = key;

    if (effectiveCandles.length === 0) {
      if (keyChanged) {
        seriesRef.current.setData([]);
        chartRef.current?.timeScale().resetTimeScale();
        isAutoFitDoneRef.current = false;
        lastCandlesLengthRef.current = 0;
        lastClosedTimeRef.current = 0;
        isResettingRef.current = true;
      }
      return;
    }

    const sanitized = sanitizeCandles(effectiveCandles);
    if (sanitized.length === 0) {
      return;
    }

    // Only use setData for full resets or history injection.
    // Streaming updates go through handleNewCandle -> series.update().
    const numCandlesAdded = sanitized.length - lastCandlesLengthRef.current;
    const isMajorChange =
      keyChanged || lastCandlesLengthRef.current === 0 || Math.abs(numCandlesAdded) > 2;

    if (isMajorChange) {
      isResettingRef.current = false;
      const timeScale = chartRef.current?.timeScale();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- logical range shape from the dynamically-imported chart instance; see chartRef above.
      let prevLogicalRange: any = null;

      if (timeScale && isAutoFitDoneRef.current) {
        prevLogicalRange = timeScale.getVisibleLogicalRange();
      }

      const mapped = sanitized.map((c) => ({
        time: toChartTime(c.time, timeframe),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      const deduped = mapped.filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);
      seriesRef.current.setData(deduped);

      if (!isAutoFitDoneRef.current) {
        chartRef.current.timeScale().fitContent();
        isAutoFitDoneRef.current = true;
      }
      const isHistoryPrepend = isPrependingHistoryRef.current;
      isPrependingHistoryRef.current = false;
      if (prevLogicalRange && isHistoryPrepend) {
        let shift = 0;
        if (oldestTimestampRef.current) {
          const prependedCandlesCount = sanitized.findIndex((c) => c.time === oldestTimestampRef.current);
          if (prependedCandlesCount > 0) {
            shift = prependedCandlesCount;
          }
        }

        if (prevLogicalRange.from !== null && prevLogicalRange.to !== null) {
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: prevLogicalRange.from + shift,
            to: prevLogicalRange.to + shift,
          });
        }
      }
    }

    lastCandlesLengthRef.current = sanitized.length;

    if (sanitized.length > 0) {
      oldestTimestampRef.current = sanitized[0].time;
    }
  }, [effectiveCandles, symbol, timeframe, chartEpoch]);

  // Update markers.
  React.useEffect(() => {
    if (!markersPluginRef.current) return;
    const aligned = alignSignalsToBars(trades, effectiveCandles, timeframe);
    const markers = buildSeriesMarkers(aligned);
    markersPluginRef.current.setMarkers(markers);
  }, [effectiveCandles, trades, timeframe, chartEpoch]);

  // Merge live candles from polling.
  const handleNewCandle = React.useCallback(
    (candle: OhlcvCandle) => {
      if (!seriesRef.current || !chartRef.current) return;
      if (isResettingRef.current) return;

      // With a static prop-supplied dataset, never inject live candles:
      // mixing live "now" candles into historical data produces a stray
      // disconnected cluster on the chart.
      if (latestRef.current.hasOverrideCandles) return;

      // Skip live ticks until the initial historical fetch resolves. A poll
      // response landing first would otherwise seed the chart with 1-2
      // candles, causing the initial fitContent() to zoom in on that stub
      // and never widen once the real history arrives.
      if (latestRef.current.loading) return;

      if (!isValidCandle(candle)) return;

      const normalizedTime = normalizeToSeconds(Number(candle.time));

      if (!Number.isFinite(normalizedTime) || normalizedTime <= 0) return;

      const isForming = candle.isForming === true;

      // If it's a closed bar we already saw, skip.
      if (!isForming && normalizedTime <= lastClosedTimeRef.current) {
        return;
      }

      const finalTime = toChartTime(normalizedTime, latestRef.current.timeframe);

      try {
        seriesRef.current.update({
          time: finalTime,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      } catch {
        // Lightweight Charts throws when updating with a time older than the
        // earliest bar (e.g. during timeframe transitions).
        return;
      }

      if (!isForming) {
        lastClosedTimeRef.current = normalizedTime;
      }

      setCandles((prev) => {
        if (prev.length === 0) return [candle];
        const last = prev[prev.length - 1];
        const lastTime = Number(last.time);

        if (normalizedTime === lastTime) {
          const copy = [...prev];
          copy[copy.length - 1] = candle;
          return copy;
        } else if (normalizedTime > lastTime) {
          return [...prev, candle];
        }
        return prev;
      });
    },
    [setCandles],
  );

  useLatestCandlePolling(symbol, timeframe, live && candlesProp === undefined, handleNewCandle);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-card", className)}>
      {/* Loading skeleton */}
      {/* height is passed alongside inset-0 so the skeleton is correctly sized when
          used standalone (its primary use case, e.g. a Suspense fallback); here it
          also happens to match the overlay's box since the wrapper's height comes
          from the same prop. */}
      {loading && effectiveCandles.length === 0 && (
        <TradingChartSkeleton height={height} className="absolute inset-0 z-50" />
      )}

      {/* Error state */}
      {error && effectiveCandles.length === 0 && !loading && (
        <div role="alert" className="absolute inset-0 z-50 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Market data is unavailable ({error}).</p>
        </div>
      )}

      {/* No more historical data notification */}
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
});

TradingChart.displayName = "TradingChart";

export { TradingChart };
