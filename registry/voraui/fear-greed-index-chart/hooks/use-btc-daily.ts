"use client";

import { useEffect, useState } from "react";
import { isPresent, type BtcDailyPoint } from "../lib/fear-greed-bands";

export type { BtcDailyPoint };

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";
const DAY_MS = 86_400_000;
const PAGE_LIMIT = 1000;

/** Parse a Binance klines batch into daily points (open time, close price, quote volume). */
export function parseDailyKlines(batch: unknown): BtcDailyPoint[] {
  if (!Array.isArray(batch)) return [];
  const points: BtcDailyPoint[] = [];
  for (const k of batch) {
    if (!Array.isArray(k) || !isPresent(k[0]) || !isPresent(k[4]) || !isPresent(k[7])) continue;
    const openMs = Number(k[0]);
    const price = Number(k[4]);
    const volume = Number(k[7]);
    if (Number.isFinite(openMs) && Number.isFinite(price) && Number.isFinite(volume)) {
      points.push({ time: Math.floor(openMs / 1000), price, volume });
    }
  }
  return points;
}

/** Fetch BTCUSDT daily klines from `fromSeconds` onward, paginating forward. */
export async function fetchBtcDaily(
  fromSeconds: number,
  signal?: AbortSignal,
): Promise<BtcDailyPoint[]> {
  const out: BtcDailyPoint[] = [];
  let cursorMs = fromSeconds * 1000;
  // Hard cap on iterations; 20 batches of 1000 daily candles is ~54 years.
  for (let i = 0; i < 20; i++) {
    const params = new URLSearchParams({
      symbol: "BTCUSDT",
      interval: "1d",
      startTime: String(cursorMs),
      limit: String(PAGE_LIMIT),
    });
    const res = await fetch(`${BINANCE_KLINES_URL}?${params}`, { signal });
    if (!res.ok) throw new Error(`Binance klines request failed: ${res.status}`);
    const batch: unknown = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...parseDailyKlines(batch));
    if (batch.length < PAGE_LIMIT) break;
    const last: unknown = batch[batch.length - 1];
    const lastOpenMs = Array.isArray(last) && isPresent(last[0]) ? Number(last[0]) : NaN;
    if (!Number.isFinite(lastOpenMs)) break;
    cursorMs = lastOpenMs + DAY_MS;
  }
  return out;
}

type Result = { from: number; data: BtcDailyPoint[] | null };

/**
 * Load BTC daily price and volume from `from` (unix seconds). Idle while disabled or `from` is
 * null; a failed request settles with no data, so the chart falls back to the index alone.
 */
export function useBtcDaily(options: { enabled: boolean; from: number | null }) {
  const { enabled, from } = options;
  const [result, setResult] = useState<Result | null>(null);
  const active = enabled && from !== null;

  useEffect(() => {
    if (!enabled || from === null) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await fetchBtcDaily(from, controller.signal);
        if (controller.signal.aborted) return;
        setResult({ from, data });
      } catch {
        if (!controller.signal.aborted) setResult({ from, data: null });
      }
    };

    load();

    return () => controller.abort();
  }, [enabled, from]);

  const current = active && result?.from === from ? result : null;
  return { data: current?.data ?? null, loading: active && current === null };
}
