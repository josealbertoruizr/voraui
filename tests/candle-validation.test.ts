import { describe, expect, it } from "vitest";
import { isValidCandle, sanitizeCandles } from "@/registry/voraui/trading-chart/candle-validation";

const base = { time: 1_700_000_000, open: 100, high: 110, low: 90, close: 105, volume: 1 };

describe("isValidCandle", () => {
  it("accepts a well-formed candle", () => {
    expect(isValidCandle(base)).toBe(true);
  });

  it("rejects non-positive or non-finite values", () => {
    expect(isValidCandle({ ...base, open: 0 })).toBe(false);
    expect(isValidCandle({ ...base, close: NaN })).toBe(false);
  });

  it("rejects OHLC inconsistency", () => {
    expect(isValidCandle({ ...base, high: 101 })).toBe(false); // high < max(open, close)
    expect(isValidCandle({ ...base, low: 102 })).toBe(false); // low > min(open, close)
  });

  it("rejects candles whose range exceeds 90% of the close", () => {
    expect(isValidCandle({ ...base, high: 200, low: 5 })).toBe(false);
  });

  it("rejects millisecond timestamps", () => {
    expect(isValidCandle({ ...base, time: 1_700_000_000_000 })).toBe(false);
  });
});

describe("sanitizeCandles", () => {
  it("filters invalid candles, sorts by time, and dedupes", () => {
    const result = sanitizeCandles([
      { ...base, time: 2000 },
      { ...base, time: 1000 },
      { ...base, time: 1000 },
      { ...base, time: 3000, high: 101 }, // invalid
    ]);
    expect(result.map((c) => c.time)).toEqual([1000, 2000]);
  });
});
