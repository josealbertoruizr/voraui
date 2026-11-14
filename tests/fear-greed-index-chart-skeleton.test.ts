import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FearGreedIndexChartSkeleton } from "@/registry/voraui/fear-greed-index-chart/components/skeleton";

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
