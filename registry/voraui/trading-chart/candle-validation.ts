export function isValidCandle(candle: {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
}): boolean {
  const { open, high, low, close, time } = candle;

  if (!isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close)) {
    return false;
  }
  if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
    return false;
  }

  // OHLC consistency: high must be the highest, low the lowest.
  if (high < Math.max(open, close)) return false;
  if (low > Math.min(open, close)) return false;
  if (high < low) return false;

  // Reject candles whose range exceeds 90% of the close price.
  if ((high - low) / close > 0.9) {
    return false;
  }

  // Timestamp must be in seconds, not milliseconds.
  const MAX_REASONABLE_TS = 9_999_999_999;
  if (time > MAX_REASONABLE_TS) {
    return false;
  }

  return true;
}

export function sanitizeCandles<
  T extends { time: number; open: number; high: number; low: number; close: number },
>(candles: T[]): T[] {
  return candles
    .filter(isValidCandle)
    .sort((a, b) => a.time - b.time)
    .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);
}
