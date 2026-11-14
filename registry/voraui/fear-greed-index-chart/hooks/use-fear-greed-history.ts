"use client";

import { useEffect, useState } from "react";
import { normalizeByTime, type FearGreedPoint } from "../lib/fear-greed-bands";

export type { FearGreedPoint };

const FNG_HISTORY_URL = "https://api.alternative.me/fng/?limit=0";

/** Parse the alternative.me history payload (newest first) into ascending points. */
export function parseFngHistory(raw: unknown): FearGreedPoint[] {
  const rows = (raw as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) return [];
  const points: FearGreedPoint[] = [];
  for (const row of rows) {
    const value = Number(row?.value);
    const time = Number(row?.timestamp);
    if (Number.isFinite(value) && Number.isFinite(time)) points.push({ time, value });
  }
  return normalizeByTime(points);
}

export function useFearGreedHistory(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<FearGreedPoint[] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(FNG_HISTORY_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Fear & Greed request failed: ${res.status}`);
        const json: unknown = await res.json();
        if (controller.signal.aborted) return;
        setData(parseFngHistory(json));
        setError(null);
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted || (err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Fear & Greed request failed");
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [enabled]);

  return { data, loading, error };
}
