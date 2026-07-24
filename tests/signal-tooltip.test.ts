import { describe, expect, it } from "vitest";
import {
  getSignalTooltipPosition,
  renderTooltipHtml,
} from "@/registry/voraui/trading-chart/lib/signal-tooltip";
import type { AlignedSignal } from "@/registry/voraui/trading-chart/lib/markers";
import type { UTCTimestamp } from "lightweight-charts";

const t = 1_700_000_000 as UTCTimestamp;
const base = { id: "a", ts: 1_700_000_000_000, alignedTime: t };

describe("renderTooltipHtml", () => {
  it("shows the signal count and buy section", () => {
    const html = renderTooltipHtml([
      { ...base, side: "BUY", price: 1200, quantity: 2 } as AlignedSignal,
    ]);
    expect(html).toContain("1 Signals");
    expect(html).toContain("Buy Signals");
    expect(html).toContain("2 @ 1,200");
    expect(html).not.toContain("Sell Signals");
  });

  it("groups buys, sells, and indicator signals into sections", () => {
    const html = renderTooltipHtml([
      { ...base, id: "b", side: "BUY", price: 100 } as AlignedSignal,
      { ...base, id: "s", side: "SELL", price: 200 } as AlignedSignal,
      {
        ...base,
        id: "i",
        side: "BUY",
        price: 0,
        category: "indicator",
        indicator: "RSI",
        value: 27.5,
      } as AlignedSignal,
    ]);
    expect(html).toContain("Buy Signals");
    expect(html).toContain("Sell Signals");
    expect(html).toContain("Indicator Signals");
    expect(html).toContain("RSI BUY (27.50)");
  });

  it("escapes HTML in notes and indicator names", () => {
    const html = renderTooltipHtml([
      { ...base, side: "BUY", price: 100, note: "<img src=x onerror=alert(1)>" } as AlignedSignal,
    ]);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("has no sticky unlock footer", () => {
    const html = renderTooltipHtml([{ ...base, side: "BUY", price: 100 } as AlignedSignal]);
    expect(html).not.toContain("Click again to unlock");
  });
});

describe("getSignalTooltipPosition", () => {
  it("places the tooltip below the cursor when above would leave the chart", () => {
    const position = getSignalTooltipPosition(
      { x: 200, y: 10 },
      { width: 180, height: 96 },
      { width: 500, height: 320 },
    );

    expect(position).toEqual({ left: 110, top: 22 });
  });

  it("clamps the tooltip horizontally inside the chart", () => {
    expect(
      getSignalTooltipPosition(
        { x: 10, y: 200 },
        { width: 180, height: 96 },
        { width: 500, height: 320 },
      ).left,
    ).toBe(8);
    expect(
      getSignalTooltipPosition(
        { x: 490, y: 200 },
        { width: 180, height: 96 },
        { width: 500, height: 320 },
      ).left,
    ).toBe(312);
  });

  it("clamps a tall tooltip vertically inside the chart", () => {
    const position = getSignalTooltipPosition(
      { x: 250, y: 180 },
      { width: 180, height: 304 },
      { width: 500, height: 320 },
    );

    expect(position.top).toBe(8);
  });
});
