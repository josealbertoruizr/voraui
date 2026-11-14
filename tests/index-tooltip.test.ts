import { describe, expect, it } from "vitest";
import {
  compactUsd,
  compactUsdTick,
  renderIndexTooltipHtml,
} from "@/registry/voraui/fear-greed-index-chart/lib/index-tooltip";
import { findFearGreedBand } from "@/registry/voraui/fear-greed-index-chart/lib/fear-greed-bands";

describe("formatters", () => {
  it("formats compact USD for tooltip and axis", () => {
    expect(compactUsd(64_000)).toBe("$64.00K");
    expect(compactUsd(2_500_000_000)).toBe("$2.50B");
    expect(compactUsd(0)).toBe("-");
    expect(compactUsdTick(90_000)).toBe("$90K");
    expect(compactUsdTick(NaN)).toBe("-");
  });
});

describe("renderIndexTooltipHtml", () => {
  const band = findFearGreedBand(26);

  it("shows date, value, classification, and band color", () => {
    const html = renderIndexTooltipHtml("2026-11-14", 26, band);
    expect(html).toContain("2026-11-14");
    expect(html).toContain(">26<");
    expect(html).toContain("Fear");
    expect(html).toContain("#e0672b");
    expect(html).not.toContain("BTC");
    expect(html).not.toContain("Vol");
  });

  it("adds price and volume rows only when provided", () => {
    const priceOnly = renderIndexTooltipHtml("2026-11-14", 26, band, { price: 64_000 });
    expect(priceOnly).toContain("BTC");
    expect(priceOnly).toContain("$64.00K");
    expect(priceOnly).not.toContain("Vol");

    const both = renderIndexTooltipHtml("2026-11-14", 26, band, {
      price: 64_000,
      volume: 2_500_000_000,
    });
    expect(both).toContain("Vol");
    expect(both).toContain("$2.50B");
  });
});
