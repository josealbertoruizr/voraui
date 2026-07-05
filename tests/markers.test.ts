import { describe, expect, it } from "vitest";
import type { UTCTimestamp } from "lightweight-charts";
import {
  alignSignalsToBars,
  buildSeriesMarkers,
  floorToIntervalSeconds,
  type AlignedSignal,
} from "@/registry/voraui/trading-chart/markers";
import type { OhlcvCandle, TradeSignal } from "@/registry/voraui/trading-chart/trading-chart-types";

function candle(time: number): OhlcvCandle {
  return { time, open: 100, high: 110, low: 90, close: 105, volume: 1 };
}

function signal(over: Partial<TradeSignal>): TradeSignal {
  return { id: "x", ts: 0, side: "BUY", price: 100, ...over };
}

function alignedSignal(over: Partial<AlignedSignal>): AlignedSignal {
  return { ...signal({}), alignedTime: 1000 as UTCTimestamp, ...over };
}

describe("floorToIntervalSeconds", () => {
  it("floors to the hour for 1h", () => {
    const ts = Date.UTC(2026, 0, 15, 13, 47, 12);
    expect(floorToIntervalSeconds(ts, "1h")).toBe(Date.UTC(2026, 0, 15, 13) / 1000);
  });

  it("floors to the 4-hour block for 4h", () => {
    const ts = Date.UTC(2026, 0, 15, 14, 30, 0);
    expect(floorToIntervalSeconds(ts, "4h")).toBe(Date.UTC(2026, 0, 15, 12) / 1000);
  });

  it("floors to UTC midnight for 1d", () => {
    const ts = Date.UTC(2026, 0, 15, 22, 10, 0);
    expect(floorToIntervalSeconds(ts, "1d")).toBe(Date.UTC(2026, 0, 15) / 1000);
  });

  it("floors to Monday for 1w", () => {
    const wednesday = Date.UTC(2026, 0, 14, 9, 0, 0);
    expect(floorToIntervalSeconds(wednesday, "1w")).toBe(Date.UTC(2026, 0, 12) / 1000);
  });

  it("floors to the first of the month for 1M", () => {
    const ts = Date.UTC(2026, 0, 20, 9, 0, 0);
    expect(floorToIntervalSeconds(ts, "1M")).toBe(Date.UTC(2026, 0, 1) / 1000);
  });
});

describe("alignSignalsToBars", () => {
  it("snaps a signal to its interval bar when the bar exists", () => {
    const candles = [candle(3600), candle(7200)];
    const signals = [signal({ ts: 7_500_000 })]; // 7500s -> floors to 7200 for 1h
    const aligned = alignSignalsToBars(signals, candles, "1h");
    expect(aligned[0].alignedTime).toBe(7200);
  });

  it("falls back to the closest bar when the floored bar is missing", () => {
    const candles = [candle(3600), candle(14400)];
    const signals = [signal({ ts: 7_500_000 })]; // snaps to 7200, which has no bar
    const aligned = alignSignalsToBars(signals, candles, "1h");
    expect(aligned[0].alignedTime).toBe(3600); // 3600 is 3600s away, 14400 is 7200s away
  });

  it("returns empty for no signals or no candles", () => {
    expect(alignSignalsToBars([], [candle(1)], "1h")).toEqual([]);
    expect(alignSignalsToBars([signal({})], [], "1h")).toEqual([]);
  });
});

describe("buildSeriesMarkers", () => {
  it("clusters same-candle same-side trades into one marker with a count label", () => {
    const markers = buildSeriesMarkers([
      alignedSignal({ id: "1" }),
      alignedSignal({ id: "2" }),
      alignedSignal({ id: "3" }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].text).toBe("3B");
    expect(markers[0].size).toBe(2);
    expect(markers[0].position).toBe("belowBar");
    expect(markers[0].shape).toBe("arrowUp");
  });

  it("renders single trades with a plain B/S label", () => {
    const markers = buildSeriesMarkers([alignedSignal({ side: "SELL" })]);
    expect(markers[0].text).toBe("S");
    expect(markers[0].position).toBe("aboveBar");
    expect(markers[0].shape).toBe("arrowDown");
  });

  it("keeps buys and sells on the same candle as separate markers", () => {
    const markers = buildSeriesMarkers([
      alignedSignal({ id: "1", side: "BUY" }),
      alignedSignal({ id: "2", side: "SELL" }),
    ]);
    expect(markers).toHaveLength(2);
  });

  it("renders indicator signals as in-bar circles", () => {
    const markers = buildSeriesMarkers([alignedSignal({ category: "indicator" })]);
    expect(markers[0].position).toBe("inBar");
    expect(markers[0].shape).toBe("circle");
    expect(markers[0].text).toBe("I");
  });

  it("sorts markers by time", () => {
    const markers = buildSeriesMarkers([
      alignedSignal({ id: "1", alignedTime: 2000 as UTCTimestamp }),
      alignedSignal({ id: "2", alignedTime: 1000 as UTCTimestamp, side: "SELL" }),
    ]);
    expect(markers.map((m) => m.time)).toEqual([1000, 2000]);
  });
});
