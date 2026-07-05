"use client";

import * as React from "react";
import type { OhlcvCandle, Timeframe } from "./types";
import { sanitizeCandles } from "./candle-validation";

// Binance public spot klines. No API key, CORS-enabled, ~1200 weight/min/IP.
const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";

/** Binance kline row: [openTimeMs, open, high, low, close, volume, closeTimeMs, ...]. */
export type RawKline = [number, string, string, string, string, string, number, ...unknown[]];

export function normalizeKlines(raw: RawKline[], nowMs: number = Date.now()): OhlcvCandle[] {
  const out: OhlcvCandle[] = [];
  for (const k of raw ?? []) {
    const openMs = Number(k[0]);
    const open = Number(k[1]);
    const high = Number(k[2]);
    const low = Number(k[3]);
    const close = Number(k[4]);
    const volume = Number(k[5]);
    const closeMs = Number(k[6]);
    if (![openMs, open, high, low, close, volume, closeMs].every(Number.isFinite)) continue;
    out.push({
      time: Math.floor(openMs / 1000),
      open,
      high,
      low,
      close,
      volume,
      isForming: closeMs > nowMs,
    });
  }
  return out;
}

export async function fetchKlines(
  symbol: string,
  interval: Timeframe,
  options: { limit?: number; startTime?: number; endTime?: number; signal?: AbortSignal } = {},
): Promise<OhlcvCandle[]> {
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
    limit: String(options.limit ?? 500),
  });
  if (options.startTime !== undefined) params.set("startTime", String(options.startTime));
  if (options.endTime !== undefined) params.set("endTime", String(options.endTime));
  const res = await fetch(`${BINANCE_KLINES_URL}?${params}`, { signal: options.signal });
  if (!res.ok) throw new Error(`Binance klines request failed: ${res.status}`);
  const raw = (await res.json()) as RawKline[];
  return normalizeKlines(raw);
}

/** Fetch historical candles with backward pagination support. */
export function useKlines(
  symbol: string,
  timeframe: Timeframe,
  options: { limit?: number; enabled?: boolean } = {},
) {
  const { limit = 500, enabled = true } = options;
  const [candles, setCandles] = React.useState<OhlcvCandle[]>([]);
  const [loading, setLoading] = React.useState(enabled);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = React.useState(true);
  const lastOldestRef = React.useRef<number | null>(null);

  const fetchMore = React.useCallback(
    async (beforeSec: number) => {
      try {
        const older = await fetchKlines(symbol, timeframe, {
          limit: 500,
          endTime: beforeSec * 1000 - 1,
        });
        if (older.length === 0) {
          setHasMoreHistory(false);
          return [];
        }
        const newOldest = older[0].time;
        // If the oldest timestamp didn't advance, we've hit the listing boundary.
        if (lastOldestRef.current !== null && newOldest >= lastOldestRef.current) {
          setHasMoreHistory(false);
          return [];
        }
        lastOldestRef.current = newOldest;
        setCandles((prev) => sanitizeCandles([...older, ...prev]));
        return older;
      } catch {
        setHasMoreHistory(false);
        return [];
      }
    },
    [symbol, timeframe],
  );

  React.useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    const load = async () => {
      // Clear state on key param change so the chart resets cleanly.
      setCandles([]);
      setHasMoreHistory(true);
      setError(null);
      setLoading(true);
      lastOldestRef.current = null;

      try {
        const initial = await fetchKlines(symbol, timeframe, { limit, signal: controller.signal });
        if (controller.signal.aborted) return;
        setCandles(sanitizeCandles(initial));
        setLoading(false);
      } catch (err: unknown) {
        if (controller.signal.aborted || (err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [symbol, timeframe, limit, enabled]);

  // Loading is forced false while disabled so a mid-fetch enabled->false toggle cannot leave it stuck.
  return { candles, setCandles, loading: enabled ? loading : false, error, fetchMore, hasMoreHistory };
}

/** Poll Binance for the latest (closed + forming) candles and push them to the chart. */
export function useLatestCandlePolling(
  symbol: string,
  timeframe: Timeframe,
  enabled: boolean,
  onUpdate: (candle: OhlcvCandle) => void,
) {
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!enabled || !symbol) return;
    let active = true;

    const intervalFor = (tf: Timeframe): number => {
      switch (tf) {
        case "1m":
          return 4_000;
        case "5m":
        case "15m":
          return 12_000;
        case "1h":
        case "4h":
        case "8h":
          return 25_000;
        case "1d":
        case "1w":
        case "1M":
          return 60_000;
        default:
          return 30_000;
      }
    };

    const poll = async () => {
      try {
        const latest = await fetchKlines(symbol, timeframe, { limit: 2 });
        if (!active) return;
        for (const candle of latest) onUpdate(candle);
      } catch {
        // Transient network failures are retried on the next tick.
      }
      if (active) timerRef.current = setTimeout(poll, intervalFor(timeframe));
    };

    poll();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [symbol, timeframe, enabled, onUpdate]);
}
