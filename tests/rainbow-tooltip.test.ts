import { describe, expect, it } from "vitest";
import { compactUsd, renderRainbowTooltipHtml } from "@/registry/voraui/btc-rainbow-chart/rainbow-tooltip";
import { DEFAULT_RAINBOW_BANDS } from "@/registry/voraui/btc-rainbow-chart/rainbow-bands";

describe("compactUsd", () => {
  it("formats magnitudes with the right suffix", () => {
    expect(compactUsd(2_500_000_000)).toBe("$2.50B");
    expect(compactUsd(3_500_000)).toBe("$3.50M");
    expect(compactUsd(64_000)).toBe("$64.00K");
    expect(compactUsd(12.345)).toBe("$12.35");
    expect(compactUsd(0.1234)).toBe("$0.1234");
  });

  it("returns a dash for zero and non-finite values", () => {
    expect(compactUsd(0)).toBe("-");
    expect(compactUsd(NaN)).toBe("-");
  });
});

describe("renderRainbowTooltipHtml", () => {
  it("shows date, compact price, and the band label", () => {
    const band = DEFAULT_RAINBOW_BANDS[0];
    const html = renderRainbowTooltipHtml("2024-01-01", 64_000, band);
    expect(html).toContain("2024-01-01");
    expect(html).toContain("$64.00K");
    expect(html).toContain(band.label);
    expect(html).toContain(band.color);
  });

  it("omits the band row when no band matches", () => {
    const html = renderRainbowTooltipHtml("2024-01-01", 100, null);
    expect(html).not.toContain("rounded-full");
  });

  it("escapes HTML in band labels", () => {
    const html = renderRainbowTooltipHtml("2024-01-01", 100, {
      key: "x",
      label: "<b>evil</b>",
      offset: 0,
      color: "#fff",
    });
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>evil</b>");
  });
});
