import { describe, expect, it } from "vitest";
import {
  computeAltseason,
  type PaprikaTicker,
} from "@/registry/voraui/altseason-gauge/altseason";

function ticker(symbol: string, rank: number, change30d: number | null): PaprikaTicker {
  return { symbol, rank, quotes: { USD: { percent_change_30d: change30d } } };
}

describe("computeAltseason", () => {
  it("counts alts outperforming BTC and scores as a percentage", () => {
    const tickers = [
      ticker("BTC", 1, 10),
      ticker("AAA", 2, 20),
      ticker("BBB", 3, 5),
      ticker("CCC", 4, 30),
      ticker("DDD", 5, -2),
    ];
    const result = computeAltseason(tickers, "30d");
    expect(result.compared).toBe(4);
    expect(result.outperforming).toBe(2);
    expect(result.score).toBe(50);
    expect(result.label).toBe("Mixed");
    expect(result.btcChangePct).toBe(10);
    expect(result.window).toBe("30d");
  });

  it("excludes stablecoins and wrapped assets", () => {
    const tickers = [
      ticker("BTC", 1, 0),
      ticker("USDT", 2, 100),
      ticker("WBTC", 3, 100),
      ticker("STETH", 4, 100),
      ticker("ETH", 5, 10),
    ];
    const result = computeAltseason(tickers, "30d");
    expect(result.compared).toBe(1);
    expect(result.outperforming).toBe(1);
  });

  it("labels score >= 75 as Altcoin Season and <= 25 as Bitcoin Season", () => {
    const alt = computeAltseason(
      [ticker("BTC", 1, 0), ticker("AAA", 2, 5), ticker("BBB", 3, 5), ticker("CCC", 4, 5), ticker("DDD", 5, -1)],
      "30d",
    );
    expect(alt.score).toBe(75);
    expect(alt.label).toBe("Altcoin Season");

    const btc = computeAltseason(
      [ticker("BTC", 1, 10), ticker("AAA", 2, 20), ticker("BBB", 3, 1), ticker("CCC", 4, 1), ticker("DDD", 5, 1)],
      "30d",
    );
    expect(btc.score).toBe(25);
    expect(btc.label).toBe("Bitcoin Season");
  });

  it("returns Unknown when BTC is missing from the payload", () => {
    const result = computeAltseason([ticker("AAA", 2, 20)], "30d");
    expect(result.score).toBeNull();
    expect(result.label).toBe("Unknown");
    expect(result.btcChangePct).toBeNull();
    expect(result.compared).toBe(0);
  });

  it("only compares the top 50 qualifying alts by rank", () => {
    const tickers: PaprikaTicker[] = [ticker("BTC", 1, 0)];
    for (let i = 0; i < 60; i++) {
      tickers.push(ticker(`ALT${i}`, i + 2, 100));
    }
    const result = computeAltseason(tickers, "30d");
    expect(result.compared).toBe(50);
    expect(result.outperforming).toBe(50);
    expect(result.score).toBe(100);
  });

  it("ignores tickers missing the window column and rounds outputs", () => {
    const tickers = [
      ticker("BTC", 1, 10.126),
      ticker("AAA", 2, 20),
      ticker("BBB", 3, null),
      ticker("CCC", 4, 5),
      ticker("DDD", 5, 5),
    ];
    const result = computeAltseason(tickers, "30d");
    expect(result.compared).toBe(3);
    expect(result.score).toBe(33.3);
    expect(result.btcChangePct).toBe(10.13);
  });

  it("returns Unknown when the window column is dead (all zeros)", () => {
    const tickers = [
      ticker("BTC", 1, 0),
      ticker("AAA", 2, 0),
      ticker("BBB", 3, 0),
      ticker("CCC", 4, 0),
      ticker("DDD", 5, 0),
      ticker("EEE", 6, 0),
    ];
    const result = computeAltseason(tickers, "30d");
    expect(result.score).toBeNull();
    expect(result.label).toBe("Unknown");
    expect(result.btcChangePct).toBeNull();
    expect(result.compared).toBe(0);
  });

  it("still counts a genuine all-zero-alts market when BTC moved", () => {
    const tickers = [
      ticker("BTC", 1, 5),
      ticker("AAA", 2, 0),
      ticker("BBB", 3, 0),
      ticker("CCC", 4, 0),
    ];
    const result = computeAltseason(tickers, "30d");
    expect(result.score).toBe(0);
    expect(result.label).toBe("Bitcoin Season");
    expect(result.btcChangePct).toBe(5);
  });
});
