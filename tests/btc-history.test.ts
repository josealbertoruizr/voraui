import { describe, expect, it } from "vitest";
import { mergeBtcHistory } from "@/registry/voraui/btc-rainbow-chart/hooks/use-btc-history";

describe("mergeBtcHistory", () => {
  it("prefers Binance values on overlapping days and sorts ascending", () => {
    const seed = [
      [200, 2],
      [100, 1],
    ] as const;
    const binance = [
      { time: 300, price: 6 },
      { time: 200, price: 5 },
    ];
    expect(mergeBtcHistory(seed, binance)).toEqual([
      { time: 100, price: 1 },
      { time: 200, price: 5 },
      { time: 300, price: 6 },
    ]);
  });

  it("handles an empty Binance batch (seed only)", () => {
    expect(mergeBtcHistory([[100, 1]] as const, [])).toEqual([{ time: 100, price: 1 }]);
  });
});
