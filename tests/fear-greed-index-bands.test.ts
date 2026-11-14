import { describe, expect, it } from "vitest";
import {
  FEAR_GREED_BANDS,
  clipToRange,
  findFearGreedBand,
  normalizeByTime,
  toIndexLineData,
} from "@/registry/voraui/fear-greed-index-chart/lib/fear-greed-bands";

describe("FEAR_GREED_BANDS", () => {
  it("mirrors alternative.me thresholds with the gauge colors", () => {
    expect(FEAR_GREED_BANDS.map((b) => [b.label, b.min, b.max, b.color])).toEqual([
      ["Extreme Fear", 0, 24, "#c0392b"],
      ["Fear", 25, 44, "#e0672b"],
      ["Neutral", 45, 55, "#f0c929"],
      ["Greed", 56, 75, "#4caf50"],
      ["Extreme Greed", 76, 100, "#2e7d32"],
    ]);
  });
});

describe("findFearGreedBand", () => {
  it("maps boundary values to the right band", () => {
    expect(findFearGreedBand(24).key).toBe("extreme-fear");
    expect(findFearGreedBand(25).key).toBe("fear");
    expect(findFearGreedBand(50).key).toBe("neutral");
    expect(findFearGreedBand(76).key).toBe("extreme-greed");
  });

  it("rounds fractional values and clamps out-of-range ones", () => {
    expect(findFearGreedBand(24.6).key).toBe("fear");
    expect(findFearGreedBand(-5).key).toBe("extreme-fear");
    expect(findFearGreedBand(140).key).toBe("extreme-greed");
  });
});

describe("normalizeByTime", () => {
  it("sorts ascending, keeps the last duplicate, and drops invalid times", () => {
    const out = normalizeByTime([
      { time: 300, value: 3 },
      { time: 100, value: 1 },
      { time: 300, value: 9 },
      { time: NaN, value: 5 },
      { time: 0, value: 5 },
    ]);
    expect(out).toEqual([
      { time: 100, value: 1 },
      { time: 300, value: 9 },
    ]);
  });
});

describe("toIndexLineData", () => {
  it("colors each point by its band", () => {
    expect(toIndexLineData([{ time: 100, value: 10 }, { time: 200, value: 80 }])).toEqual([
      { time: 100, value: 10, color: "#c0392b" },
      { time: 200, value: 80, color: "#2e7d32" },
    ]);
  });

  it("drops non-finite values", () => {
    expect(toIndexLineData([{ time: 100, value: NaN }])).toEqual([]);
  });
});

describe("clipToRange", () => {
  it("keeps points inside the inclusive range", () => {
    const pts = [{ time: 50 }, { time: 100 }, { time: 200 }, { time: 250 }];
    expect(clipToRange(pts, 100, 200)).toEqual([{ time: 100 }, { time: 200 }]);
  });
});
