import { describe, expect, it } from "vitest";
import {
  isDailyOrHigher,
  normalizeParamTime,
  normalizeToSeconds,
  toChartTime,
} from "@/registry/voraui/trading-chart/chart-time";

describe("isDailyOrHigher", () => {
  it("is true only for 1d/1w/1M", () => {
    expect(isDailyOrHigher("1d")).toBe(true);
    expect(isDailyOrHigher("1w")).toBe(true);
    expect(isDailyOrHigher("1M")).toBe(true);
    expect(isDailyOrHigher("1m")).toBe(false);
    expect(isDailyOrHigher("1h")).toBe(false);
  });
});

describe("normalizeToSeconds", () => {
  it("passes through second-precision timestamps", () => {
    expect(normalizeToSeconds(1_700_000_000)).toBe(1_700_000_000);
  });

  it("converts millisecond timestamps to seconds", () => {
    expect(normalizeToSeconds(1_700_000_000_123)).toBe(1_700_000_000);
  });
});

describe("toChartTime", () => {
  it("keeps numeric time for intraday timeframes", () => {
    expect(toChartTime(1_700_000_000, "1h")).toBe(1_700_000_000);
  });

  it("converts to a business-day string for daily+", () => {
    // 2023-11-14T22:13:20Z
    expect(toChartTime(1_700_000_000, "1d")).toBe("2023-11-14");
    expect(toChartTime(1_700_000_000, "1w")).toBe("2023-11-14");
  });
});

describe("normalizeParamTime", () => {
  it("returns numbers as-is", () => {
    expect(normalizeParamTime(1_700_000_000)).toBe(1_700_000_000);
  });

  it("parses business-day strings as UTC midnight", () => {
    expect(normalizeParamTime("2023-11-14")).toBe(Date.UTC(2023, 10, 14) / 1000);
  });

  it("parses BusinessDay objects", () => {
    expect(normalizeParamTime({ year: 2023, month: 11, day: 14 })).toBe(Date.UTC(2023, 10, 14) / 1000);
  });

  it("returns undefined for null/undefined/garbage", () => {
    expect(normalizeParamTime(null)).toBeUndefined();
    expect(normalizeParamTime(undefined)).toBeUndefined();
    expect(normalizeParamTime({})).toBeUndefined();
  });
});
