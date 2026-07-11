"use client";

import { useCallback } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { OhlcvCandle, Timeframe } from "./trading-chart-types";
import { isValidCandle } from "./candle-validation";
import { normalizeToSeconds, toChartTime } from "./chart-time";
import { useLatestCandlePolling } from "./use-klines";
import type { ChartState } from "./use-chart-instance";

export interface UseLiveCandlesOptions {
  stateRef: RefObject<ChartState>;
  symbol: string;
  timeframe: Timeframe;
  enabled: boolean;
  setCandles: Dispatch<SetStateAction<OhlcvCandle[]>>;
}

/** Merge polled live candles into the chart series and the candle state. */
export function useLiveCandles({
  stateRef,
  symbol,
  timeframe,
  enabled,
  setCandles,
}: UseLiveCandlesOptions) {
  const handleNewCandle = useCallback(
    (candle: OhlcvCandle) => {
      const state = stateRef.current;
      if (!state.series || !state.chart) return;
      if (state.isResetting) return;

      // Never mix live candles into a static prop-supplied dataset.
      if (state.latest.hasOverrideCandles) return;

      // Wait for the initial history, or fitContent would zoom into a 1-2 candle stub.
      if (state.latest.loading) return;

      if (!isValidCandle(candle)) return;

      const normalizedTime = normalizeToSeconds(Number(candle.time));
      if (!Number.isFinite(normalizedTime) || normalizedTime <= 0) return;

      const isForming = candle.isForming === true;

      // Skip closed bars we already saw.
      if (!isForming && normalizedTime <= state.lastClosedTime) return;

      try {
        state.series.update({
          time: toChartTime(normalizedTime, state.latest.timeframe),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      } catch {
        // Thrown for updates older than the earliest bar (timeframe transitions).
        return;
      }

      if (!isForming) state.lastClosedTime = normalizedTime;

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
    [stateRef, setCandles],
  );

  useLatestCandlePolling(symbol, timeframe, enabled, handleNewCandle);
}
