import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FearGreedIndexChartSkeleton } from "@/registry/voraui/fear-greed-index-chart/components/skeleton";
import { FearGreedIndexChart } from "@/registry/voraui/fear-greed-index-chart";

describe("FearGreedIndexChartSkeleton", () => {
  const html = renderToStaticMarkup(React.createElement(FearGreedIndexChartSkeleton, {}));

  it("renders a status role with an accessible loading label", () => {
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading Fear &amp; Greed history");
  });

  it("draws three preset ghost pills and a ghost index line", () => {
    expect((html.match(/h-7 w-10 rounded-md bg-muted/g) ?? []).length).toBe(3);
    expect(html).toContain("<polyline");
    expect(html).toContain("voraui-fear-greed-index-chart-skeleton-shimmer");
  });

  it("matches the live chart height to avoid layout shift", () => {
    expect(html).toContain("h-[360px]");
    expect(html).toContain("sm:h-[420px]");
  });
});

describe("FearGreedIndexChart states", () => {
  it("renders the skeleton while the bundled fetcher is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(FearGreedIndexChart, {}));
    expect(html).toContain("voraui-fear-greed-index-chart-skeleton-shimmer");
  });

  it("renders an alert instead of crashing when data is empty", () => {
    const html = renderToStaticMarkup(React.createElement(FearGreedIndexChart, { data: [] }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Fear &amp; Greed history is unavailable");
  });

  it("renders presets and an index-only legend when BTC layers are off", () => {
    const html = renderToStaticMarkup(
      React.createElement(FearGreedIndexChart, {
        data: [{ time: 1_794_614_400, value: 26 }],
        showPrice: false,
      }),
    );
    expect(html).toContain("30D");
    expect(html).toContain("1Y");
    expect(html).toContain("ALL");
    expect(html).toContain("Fear &amp; Greed Index");
    expect(html).not.toContain("Bitcoin Price");
    expect(html).not.toContain("Bitcoin Volume");
  });

  it("lists price and volume in the legend when both BTC layers are drawn", () => {
    const html = renderToStaticMarkup(
      React.createElement(FearGreedIndexChart, {
        data: [{ time: 1_794_614_400, value: 26 }],
        btcData: [{ time: 1_794_614_400, price: 90000, volume: 1 }],
        showVolume: true,
      }),
    );
    expect(html).toContain("Bitcoin Price");
    expect(html).toContain("Bitcoin Volume");
  });
});
