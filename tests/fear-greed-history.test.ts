import { describe, expect, it } from "vitest";
import { parseFngHistory } from "@/registry/voraui/fear-greed-index-chart/hooks/use-fear-greed-history";

describe("parseFngHistory", () => {
  it("converts newest-first rows into ascending points", () => {
    const raw = {
      data: [
        { value: "13", value_classification: "Extreme Fear", timestamp: "1794614400" },
        { value: "40", value_classification: "Fear", timestamp: "1794528000" },
      ],
    };
    expect(parseFngHistory(raw)).toEqual([
      { time: 1794528000, value: 40 },
      { time: 1794614400, value: 13 },
    ]);
  });

  it("drops rows with a non-numeric value or timestamp", () => {
    const raw = {
      data: [
        { value: "abc", timestamp: "1794614400" },
        { value: "55", timestamp: "nope" },
        { value: "60", timestamp: "1794528000" },
      ],
    };
    expect(parseFngHistory(raw)).toEqual([{ time: 1794528000, value: 60 }]);
  });

  it("returns an empty array for malformed payloads", () => {
    expect(parseFngHistory(null)).toEqual([]);
    expect(parseFngHistory({})).toEqual([]);
    expect(parseFngHistory({ data: "x" })).toEqual([]);
  });
});
