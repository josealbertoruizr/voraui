"use client";

import * as React from "react";
import { BTC_DAILY_SEED } from "./btc-seed";

export interface RainbowPoint {
  /** Unix seconds (UTC day open). */
  time: number;
  /** Daily close in USD. */
  price: number;
}

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";
// First Binance BTCUSDT spot candle: 2017-08-17 00:00 UTC.
const BINANCE_BTCUSDT_START_MS = 1_502_928_000_000;
const DAY_MS = 86_400_000;

/** Merge seed and Binance series; Binance wins on any overlapping day. */
export function mergeBtcHistory(
  seed: ReadonlyArray<readonly [number, number]>,
  binance: RainbowPoint[],
): RainbowPoint[] {
  const byTime = new Map<number, number>();
  for (const [time, price] of seed) byTime.set(time, price);
  for (const point of binance) byTime.set(point.time, point.price);
  return [...byTime.entries()]
    .map(([time, price]) => ({ time, price }))
    .sort((a, b) => a.time - b.time);
}

/** Paginate Binance daily klines forward from 2017-08-17 in 1000-candle batches. */
export async function fetchBinanceDailyCloses(signal?: AbortSignal): Promise<RainbowPoint[]> {
  const out: RainbowPoint[] = [];
  let cursorMs = BINANCE_BTCUSDT_START_MS;
  // Hard cap on iterations; 20 batches of 1000 daily candles is ~54 years.
  for (let i = 0; i < 20; i++) {
    const params = new URLSearchParams({
      symbol: "BTCUSDT",
      interval: "1d",
      startTime: String(cursorMs),
      limit: "1000",
    });
    const res = await fetch(`${BINANCE_KLINES_URL}?${params}`, { signal });
    if (!res.ok) throw new Error(`Binance klines request failed: ${res.status}`);
    const batch = (await res.json()) as unknown[][];
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const k of batch) {
      const openMs = Number(k[0]);
      const close = Number(k[4]);
      if (Number.isFinite(openMs) && Number.isFinite(close)) {
        out.push({ time: Math.floor(openMs / 1000), price: close });
      }
    }
    if (batch.length < 1000) break;
    cursorMs = Number(batch[batch.length - 1][0]) + DAY_MS;
  }
  return out;
}

export function useBtcHistory(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [data, setData] = React.useState<RainbowPoint[] | null>(null);
  const [loading, setLoading] = React.useState(enabled);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const binance = await fetchBinanceDailyCloses(controller.signal);
        if (controller.signal.aborted) return;
        setData(mergeBtcHistory(BTC_DAILY_SEED, binance));
        setError(null);
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted || (err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Binance klines request failed");
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [enabled]);

  return { data, loading, error };
}
