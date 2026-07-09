import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TradingChartSkeleton, generateGhostCandles } from "@/registry/voraui/trading-chart/trading-chart-skeleton";
import { TradingChart } from "@/registry/voraui/trading-chart/trading-chart";

describe("generateGhostCandles", () => {
  it("returns the requested number of deterministic candles within range", () => {
    const first = generateGhostCandles(48);
    const second = generateGhostCandles(48);
    expect(first).toHaveLength(48);
    expect(first).toEqual(second);
    for (const candle of first) {
      expect(candle.bodyHeightPct).toBeGreaterThan(0);
      expect(candle.bodyHeightPct).toBeLessThanOrEqual(100);
      expect(candle.wickHeightPct).toBeGreaterThanOrEqual(candle.bodyHeightPct);
      expect(candle.wickHeightPct).toBeLessThanOrEqual(100);
    }
  });
});

describe("TradingChartSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(TradingChartSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading market data");
  });

  it("sizes the root to the height prop", () => {
    const html = renderToStaticMarkup(React.createElement(TradingChartSkeleton, { height: 640 }));
    expect(html).toContain("height:640px");
  });
});

describe("TradingChart loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(TradingChart, {}));
    expect(html).toContain("voraui-trading-chart-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
