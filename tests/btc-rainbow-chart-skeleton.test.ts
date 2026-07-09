import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BtcRainbowChartSkeleton } from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton";
import { BtcRainbowChart } from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart";

describe("BtcRainbowChartSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(BtcRainbowChartSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading BTC price history");
  });

  it("draws four preset ghost pills and a ghost price line", () => {
    const html = renderToStaticMarkup(React.createElement(BtcRainbowChartSkeleton, {}));
    expect((html.match(/h-7 w-10 rounded-md bg-muted/g) ?? []).length).toBe(4);
    expect(html).toContain("<polyline");
  });
});

describe("BtcRainbowChart loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(BtcRainbowChart, {}));
    expect(html).toContain("voraui-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
