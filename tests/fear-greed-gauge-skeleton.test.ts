import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FearGreedGaugeSkeleton } from "@/registry/voraui/fear-greed-gauge/components/skeleton";
import { FearGreedGauge } from "@/registry/voraui/fear-greed-gauge";

describe("FearGreedGaugeSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(FearGreedGaugeSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading Fear &amp; Greed Index");
  });

  it("draws wedge paths for the wedges variant and a single arc for the others", () => {
    const wedges = renderToStaticMarkup(React.createElement(FearGreedGaugeSkeleton, { variant: "wedges" }));
    const gradient = renderToStaticMarkup(React.createElement(FearGreedGaugeSkeleton, { variant: "gradient" }));
    expect((wedges.match(/<path/g) ?? []).length).toBe(5);
    expect((gradient.match(/<path/g) ?? []).length).toBe(1);
  });
});

describe("FearGreedGauge loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(FearGreedGauge, {}));
    expect(html).toContain("voraui-fear-greed-gauge-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
