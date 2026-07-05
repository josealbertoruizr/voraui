"use client";

import * as React from "react";
import {
  computeAltseason,
  type AltseasonData,
  type AltseasonWindow,
  type PaprikaTicker,
} from "./altseason";

// CoinPaprika public tickers endpoint. Free, no API key. The response is
// large (5000+ tickers) but a single request every refresh interval is fine.
const TICKERS_URL = "https://api.coinpaprika.com/v1/tickers?quotes=USD";

export function useAltseason(
  window: AltseasonWindow = "7d",
  options: { enabled?: boolean; refreshInterval?: number } = {},
) {
  const { enabled = true, refreshInterval = 1_800_000 } = options;
  const [data, setData] = React.useState<AltseasonData | null>(null);
  const [loading, setLoading] = React.useState(enabled);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(TICKERS_URL);
        if (!res.ok) throw new Error(`CoinPaprika request failed: ${res.status}`);
        const raw = (await res.json()) as PaprikaTicker[];
        if (cancelled) return;
        setData(computeAltseason(Array.isArray(raw) ? raw : [], window));
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
