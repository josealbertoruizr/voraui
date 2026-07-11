/** Timeframes lightweight-charts renders as business days rather than timestamps. */
const DAILY_PLUS: ReadonlySet<string> = new Set(["1d", "1w", "1M"]);

export function isDailyOrHigher(timeframe: string): boolean {
  return DAILY_PLUS.has(timeframe);
}

/** Accepts epoch seconds or milliseconds and returns epoch seconds. */
export function normalizeToSeconds(ts: number): number {
  return ts > 9_999_999_999 ? Math.floor(ts / 1000) : ts;
}

/**
 * Unix seconds to a lightweight-charts Time value. Daily+ series use
 * business-day strings ("YYYY-MM-DD"); intraday series use the raw number.
 */
export function toChartTime(timeSec: number, timeframe: string): number | string {
  return isDailyOrHigher(timeframe)
    ? new Date(timeSec * 1000).toISOString().split("T")[0]
    : timeSec;
}

/**
 * A lightweight-charts event time (number for intraday, "YYYY-MM-DD" string
 * or BusinessDay object for daily+) back to unix seconds, for comparing
 * against candle and marker times.
 */
export function normalizeParamTime(t: unknown): number | undefined {
  if (t == null) return undefined;
  if (typeof t === "number") return t;
  if (typeof t === "string") return Math.floor(new Date(t + "T00:00:00Z").getTime() / 1000);
  if (typeof t === "object" && "year" in t) {
    const bd = t as { year: number; month: number; day: number };
    return Math.floor(Date.UTC(bd.year, bd.month - 1, bd.day) / 1000);
  }
  return undefined;
}
