import { describe, expect, it, vi } from "vitest";
import { fetchTickersWithRetry } from "@/registry/voraui/altseason-gauge/hooks/use-altseason";
import type { PaprikaTicker } from "@/registry/voraui/altseason-gauge/lib/altseason";

describe("fetchTickersWithRetry", () => {
  it("returns data from the first successful attempt", async () => {
    const tickers: PaprikaTicker[] = [{ symbol: "BTC", rank: 1, quotes: { USD: { percent_change_7d: 1 } } }];
    const fetcher = vi.fn().mockResolvedValue(tickers);

    const result = await fetchTickersWithRetry(fetcher, 3, 0);

    expect(result).toBe(tickers);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retries after a transient failure and returns the next successful result", async () => {
    const tickers: PaprikaTicker[] = [{ symbol: "BTC", rank: 1, quotes: { USD: { percent_change_7d: 1 } } }];
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("CoinPaprika request failed: 502"))
      .mockResolvedValueOnce(tickers);

    const result = await fetchTickersWithRetry(fetcher, 3, 0);

    expect(result).toBe(tickers);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("throws the last error after exhausting all attempts", async () => {
    const error = new Error("CoinPaprika request failed: 522");
    const fetcher = vi.fn().mockRejectedValue(error);

    await expect(fetchTickersWithRetry(fetcher, 3, 0)).rejects.toThrow("CoinPaprika request failed: 522");
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
