"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useTheme } from "next-themes";
import type {
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LogicalRange,
  Time,
} from "lightweight-charts";
import type { OhlcvCandle, Timeframe, TradeSignal } from "../types";
import { CANDLE_SERIES_OPTIONS, getChartOptions } from "../lib/chart-options";
import { createSignalTooltip, type SignalTooltip } from "../lib/signal-tooltip";

/** Props snapshot for the imperative chart handlers, so they never see stale closures. */
export interface LatestChartProps {
  candles: OhlcvCandle[];
  trades: TradeSignal[];
  timeframe: Timeframe;
  showTooltips: boolean;
  loading: boolean;
  hasOverrideCandles: boolean;
  hasMoreHistory: boolean;
  fetchMore: (beforeSec: number) => Promise<OhlcvCandle[]>;
}

/** Mutable chart runtime shared by the trading chart hooks. */
export interface ChartState {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  markers: ISeriesMarkersPluginApi<Time> | null;
  latest: LatestChartProps;
  /** True once the initial fitContent ran for the current chart instance. */
  autoFitDone: boolean;
  lastCandlesLength: number;
  /** Last seen `${symbol}-${timeframe}`, to detect dataset resets. */
  lastKey: string;
  /** Open time of the newest closed bar merged from live polling. */
  lastClosedTime: number;
  /** True between a symbol/timeframe reset and the next full setData. */
  isResetting: boolean;
  /** Set by pagination, consumed by the next data-sync run (survives until read). */
  isPrependingHistory: boolean;
  oldestTimestamp: number | null;
}

export interface UseChartInstanceOptions extends LatestChartProps {
  symbol: string;
  height: number;
}

/** Owns the chart lifecycle: lazy init, tooltip, pagination, resize, disposal. */
export function useChartInstance(options: UseChartInstanceOptions): {
  containerRef: RefObject<HTMLDivElement | null>;
  stateRef: RefObject<ChartState>;
  /** Bumped when a freshly initialized chart instance is ready for data. */
  chartEpoch: number;
} {
  const { symbol, height, ...latest } = options;
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<SignalTooltip | null>(null);
  const [chartEpoch, setChartEpoch] = useState(0);

  const stateRef = useRef<ChartState>({
    chart: null,
    series: null,
    markers: null,
    latest,
    autoFitDone: false,
    lastCandlesLength: 0,
    lastKey: `${symbol}-${latest.timeframe}`,
    lastClosedTime: 0,
    isResetting: false,
    isPrependingHistory: false,
    oldestTimestamp: null,
  });

  useEffect(() => {
    stateRef.current.latest = latest;
  });

  useEffect(() => {
    if (!latest.showTooltips) tooltipRef.current?.hide();
  }, [latest.showTooltips]);

  useEffect(() => {
    const state = stateRef.current;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    let chartInitialized = false;
    let isLoadingMore = false;

    const handleVisibleRangeChange = async (range: LogicalRange | null) => {
      if (!range || isLoadingMore || !state.oldestTimestamp || !state.latest.hasMoreHistory) {
        return;
      }

      // A full-dataset range is the initial fitContent or a zoom-out, not a
      // scroll toward history; only paginate on a real move to the left edge.
      if (range.to >= state.latest.candles.length - 2) return;
      if (range.from >= 50) return;

      isLoadingMore = true;
      try {
        const older = await state.latest.fetchMore(state.oldestTimestamp);
        // Only flag a prepend when candles were actually fetched.
        state.isPrependingHistory = older.length > 0;
      } finally {
        isLoadingMore = false;
      }
    };

    const initChart = async (container: HTMLDivElement) => {
      const { createChart, CandlestickSeries, createSeriesMarkers } = await import(
        "lightweight-charts"
      );
      if (disposed) return;

      const chart = createChart(container, {
        width: container.clientWidth,
        ...getChartOptions(resolvedTheme, height),
      });
      const series = chart.addSeries(CandlestickSeries, CANDLE_SERIES_OPTIONS);

      state.chart = chart;
      state.series = series;
      state.markers = createSeriesMarkers(series, []);

      const tooltip = createSignalTooltip({
        container,
        getCandles: () => state.latest.candles,
        getTrades: () => state.latest.trades,
        getTimeframe: () => state.latest.timeframe,
        isEnabled: () => state.latest.showTooltips,
      });
      tooltipRef.current = tooltip;
      chart.subscribeCrosshairMove(tooltip.onCrosshairMove);

      chart.timeScale().fitContent();
      chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

      setChartEpoch((epoch) => epoch + 1);
    };

    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        const { width, height: rectHeight } = entries[0].contentRect;
        if (width > 0 && rectHeight > 0 && !chartInitialized) {
          chartInitialized = true;
          initChart(containerRef.current!);
        } else if (width > 0 && chartInitialized && state.chart) {
          state.chart.applyOptions({ width });
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      tooltipRef.current?.dispose();
      tooltipRef.current = null;
      state.chart?.remove();
      state.chart = null;
      state.series = null;
      state.markers = null;
      // Forces the next data-sync run to setData + fitContent the new instance.
      state.lastCandlesLength = 0;
      state.autoFitDone = false;
    };
    // Only reinitialize if height changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  return { containerRef, stateRef, chartEpoch };
}
