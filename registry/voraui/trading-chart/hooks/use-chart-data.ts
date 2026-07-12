"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import type { LogicalRange } from "lightweight-charts";
import type { OhlcvCandle, Timeframe, TradeSignal } from "../types";
import { sanitizeCandles } from "../lib/candle-validation";
import { toChartTime } from "../lib/chart-time";
import { alignSignalsToBars, buildSeriesMarkers } from "../lib/markers";
import type { ChartState } from "./use-chart-instance";

export interface UseChartDataOptions {
  stateRef: RefObject<ChartState>;
  /** Bumped by useChartInstance when a fresh chart instance is ready for data. */
  chartEpoch: number;
  candles: OhlcvCandle[];
  trades: TradeSignal[];
  symbol: string;
  timeframe: Timeframe;
}

/** Push candles and trade markers into the chart whenever they change. */
export function useChartData({
  stateRef,
  chartEpoch,
  candles,
  trades,
  symbol,
  timeframe,
}: UseChartDataOptions) {
  // Sync candle data.
  useEffect(() => {
    const state = stateRef.current;
    if (!state.series || !state.chart) return;

    const key = `${symbol}-${timeframe}`;
    const keyChanged = state.lastKey !== key;
    state.lastKey = key;

    if (candles.length === 0) {
      if (keyChanged) {
        state.series.setData([]);
        state.chart.timeScale().resetTimeScale();
        state.autoFitDone = false;
        state.lastCandlesLength = 0;
        state.lastClosedTime = 0;
        state.isResetting = true;
      }
      return;
    }

    const sanitized = sanitizeCandles(candles);
    if (sanitized.length === 0) return;

    // setData only on resets/history injection; streaming goes through series.update().
    const numCandlesAdded = sanitized.length - state.lastCandlesLength;
    const isMajorChange =
      keyChanged || state.lastCandlesLength === 0 || Math.abs(numCandlesAdded) > 2;

    if (isMajorChange) {
      state.isResetting = false;
      const timeScale = state.chart.timeScale();
      const prevLogicalRange: LogicalRange | null = state.autoFitDone
        ? timeScale.getVisibleLogicalRange()
        : null;

      const mapped = sanitized.map((c) => ({
        time: toChartTime(c.time, timeframe),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      const deduped = mapped.filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);
      state.series.setData(deduped);

      if (!state.autoFitDone) {
        timeScale.fitContent();
        state.autoFitDone = true;
      }

      const isHistoryPrepend = state.isPrependingHistory;
      state.isPrependingHistory = false;
      if (prevLogicalRange && isHistoryPrepend) {
        // Shift the view by the prepended count so the visible bars stay put.
        const prependedCount = state.oldestTimestamp
          ? sanitized.findIndex((c) => c.time === state.oldestTimestamp)
          : 0;
        const shift = prependedCount > 0 ? prependedCount : 0;
        timeScale.setVisibleLogicalRange({
          from: prevLogicalRange.from + shift,
          to: prevLogicalRange.to + shift,
        });
      }
    }

    state.lastCandlesLength = sanitized.length;
    state.oldestTimestamp = sanitized[0].time;
  }, [stateRef, candles, symbol, timeframe, chartEpoch]);

  // Sync trade/indicator markers.
  useEffect(() => {
    const markers = stateRef.current.markers;
    if (!markers) return;
    const aligned = alignSignalsToBars(trades, candles, timeframe);
    markers.setMarkers(buildSeriesMarkers(aligned));
  }, [stateRef, candles, trades, timeframe, chartEpoch]);
}
