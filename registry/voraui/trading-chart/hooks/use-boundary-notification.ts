"use client";

import { useEffect, useState } from "react";
import type { Timeframe } from "../types";

export interface UseBoundaryNotificationOptions {
  hasMoreHistory: boolean;
  loading: boolean;
  candlesCount: number;
  hasOverrideCandles: boolean;
  symbol: string;
  timeframe: Timeframe;
}

/** "No more historical data" toast: auto-dismisses after 4s, re-arms on key change. */
export function useBoundaryNotification({
  hasMoreHistory,
  loading,
  candlesCount,
  hasOverrideCandles,
  symbol,
  timeframe,
}: UseBoundaryNotificationOptions): boolean {
  const atHistoryBoundary = !hasMoreHistory && !loading && candlesCount > 0 && !hasOverrideCandles;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!atHistoryBoundary) return;
    const timer = setTimeout(() => setDismissedKey(`${symbol}-${timeframe}`), 4000);
    return () => clearTimeout(timer);
  }, [atHistoryBoundary, symbol, timeframe]);

  return atHistoryBoundary && dismissedKey !== `${symbol}-${timeframe}`;
}
