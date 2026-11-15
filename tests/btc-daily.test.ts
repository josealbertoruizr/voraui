import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchBtcDaily,
  parseDailyKlines,
} from "@/registry/voraui/fear-greed-index-chart/hooks/use-btc-daily";

const kline = (openMs: number, close: string, quoteVol: string) => [
  openMs, "1", "2", "0.5", close, "10", openMs + 86_399_999, quoteVol, 5, "1", "1", "0",
];

afterEach(() => vi.unstubAllGlobals());

describe("parseDailyKlines", () => {
  it("maps open time, close, and quote volume", () => {
    expect(parseDailyKlines([kline(1_517_443_200_000, "9052.5", "350000000.5")])).toEqual([
      { time: 1_517_443_200, price: 9052.5, volume: 350000000.5 },
    ]);
  });

  it("skips malformed rows and non-array payloads", () => {
    expect(parseDailyKlines([["x", 1, 2, 3, "nope"], kline(86_400_000, "1", "2")])).toEqual([
      { time: 86_400, price: 1, volume: 2 },
    ]);
    expect(parseDailyKlines({ code: -1003 })).toEqual([]);
  });

  it("rejects null and empty-string fields instead of coercing them to 0", () => {
    const row = (open: unknown, close: unknown, vol: unknown) => [
      open, "1", "2", "0.5", close, "10", 0, vol,
    ];
    expect(
      parseDailyKlines([
        row(null, "1", "2"),
        row(86_400_000, null, "2"),
        row(86_400_000, "", "2"),
        row(86_400_000, "1", null),
        row(86_400_000, "1", ""),
      ]),
    ).toEqual([]);
  });
});

describe("fetchBtcDaily", () => {
  it("paginates forward until a short batch", async () => {
    const day = 86_400_000;
    const full = Array.from({ length: 1000 }, (_, i) => kline(i * day, "1", "1"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => full })
      .mockResolvedValueOnce({ ok: true, json: async () => [kline(1000 * day, "2", "2")] });
    vi.stubGlobal("fetch", fetchMock);

    const out = await fetchBtcDaily(0);

    expect(out).toHaveLength(1001);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = new URL(fetchMock.mock.calls[0][0] as string);
    expect(first.searchParams.get("symbol")).toBe("BTCUSDT");
    expect(first.searchParams.get("interval")).toBe("1d");
    expect(first.searchParams.get("startTime")).toBe("0");
    expect(new URL(fetchMock.mock.calls[1][0] as string).searchParams.get("startTime")).toBe(
      String(1000 * day),
    );
  });

  it("rejects when any page fails, so callers fall back to index only", async () => {
    const full = Array.from({ length: 1000 }, (_, i) => kline(i * 86_400_000, "1", "1"));
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => full })
        .mockResolvedValueOnce({ ok: false, status: 429 }),
    );
    await expect(fetchBtcDaily(0)).rejects.toThrow("Binance klines request failed: 429");
  });
});
