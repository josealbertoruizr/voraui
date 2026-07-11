"use client";

import { useEffect, useState } from "react";

export interface FearGreedData {
  /** 0-100 index value, or null when the upstream has no data. */
  value: number | null;
  /** Upstream classification, e.g. "Fear", "Neutral", "Greed". */
  label: string;
  /** Upstream unix-seconds timestamp string, if provided. */
  updatedAt: string | null;
}

const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1";

export function parseFngResponse(raw: unknown): FearGreedData {
  const rows = (raw as { data?: Array<Record<string, unknown>> } | null | undefined)?.data ?? [];
  const row = rows[0];
  if (!row) return { value: null, label: "Unknown", updatedAt: null };
  const parsed = Number(row.value);
  return {
    value: Number.isFinite(parsed) ? parsed : null,
    label: typeof row.value_classification === "string" ? row.value_classification : "Neutral",
    updatedAt: typeof row.timestamp === "string" ? row.timestamp : null,
  };
}

export function useFearGreed(
  options: { enabled?: boolean; refreshInterval?: number } = {},
) {
  const { enabled = true, refreshInterval = 600_000 } = options;
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(FEAR_GREED_URL);
        if (!res.ok) throw new Error(`Fear & Greed request failed: ${res.status}`);
        const raw = await res.json();
        if (cancelled) return;
        setData(parseFngResponse(raw));
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Fear & Greed request failed");
        setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, refreshInterval);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, refreshInterval]);

  return { data, loading, error };
}
