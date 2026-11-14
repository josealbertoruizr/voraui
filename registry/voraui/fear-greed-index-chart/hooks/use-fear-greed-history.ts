"use client";

import { useEffect, useState } from "react";
import { normalizeByTime, type FearGreedPoint } from "../lib/fear-greed-bands";

export type { FearGreedPoint };

const FNG_HISTORY_URL = "https://api.alternative.me/fng/?limit=0";

const isPresent = (value: unknown) => value !== null && value !== undefined && value !== "";

type FngRow = { value?: unknown; timestamp?: unknown } | null;

/** Parse the alternative.me history payload (newest first) into ascending points. */
export function parseFngHistory(raw: unknown): FearGreedPoint[] {
  const rows = (raw as { data?: unknown } | null)?.data;
  if (!Array.isArray(rows)) return [];
  const points: FearGreedPoint[] = [];
  for (const row of rows as FngRow[]) {
    if (!isPresent(row?.value) || !isPresent(row?.timestamp)) continue;
    const value = Number(row?.value);
    const time = Number(row?.timestamp);
    if (Number.isFinite(value) && Number.isFinite(time)) points.push({ time, value });
  }
  return normalizeByTime(points);
}

type Result = { data: FearGreedPoint[] | null; error: string | null };

/** Load the full index history. Idle while disabled; `loading` holds until a fetch settles. */
export function useFearGreedHistory(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(FNG_HISTORY_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Fear & Greed request failed: ${res.status}`);
        const json: unknown = await res.json();
        if (controller.signal.aborted) return;
        setResult({ data: parseFngHistory(json), error: null });
      } catch (err) {
        if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
          return;
        }
        setResult({
          data: null,
          error: err instanceof Error ? err.message : "Fear & Greed request failed",
        });
      }
    };

    load();

    return () => controller.abort();
  }, [enabled]);

  return {
    data: result?.data ?? null,
    loading: enabled && result === null,
    error: result?.error ?? null,
  };
}
