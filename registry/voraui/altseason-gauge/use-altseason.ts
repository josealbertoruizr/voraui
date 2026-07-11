"use client";

import { useEffect, useState } from "react";
import {
  computeAltseason,
  type AltseasonData,
  type AltseasonWindow,
  type PaprikaTicker,
} from "./altseason";

// CoinPaprika public tickers. Free, no API key; large response but fetched rarely.
const TICKERS_URL = "https://api.coinpaprika.com/v1/tickers?quotes=USD";

async function fetchTickersFromCoinPaprika(): Promise<PaprikaTicker[]> {
  const res = await fetch(TICKERS_URL);
  if (!res.ok) throw new Error(`CoinPaprika request failed: ${res.status}`);
  const raw = (await res.json()) as PaprikaTicker[];
  return Array.isArray(raw) ? raw : [];
}

/** Retry transient CoinPaprika failures a couple of times before giving up. */
export async function fetchTickersWithRetry(
  fetchTickers: () => Promise<PaprikaTicker[]> = fetchTickersFromCoinPaprika,
  attempts = 3,
  retryDelayMs = 1000,
): Promise<PaprikaTicker[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetchTickers();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  throw lastError;
}

export function useAltseason(
  window: AltseasonWindow = "7d",
  options: { enabled?: boolean; refreshInterval?: number } = {},
) {
  const { enabled = true, refreshInterval = 1_800_000 } = options;
  const [data, setData] = useState<AltseasonData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await fetchTickersWithRetry();
        if (cancelled) return;
        setData(computeAltseason(raw, window));
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "CoinPaprika request failed");
        setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, refreshInterval);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, refreshInterval, window]);

  return { data, loading, error };
}
