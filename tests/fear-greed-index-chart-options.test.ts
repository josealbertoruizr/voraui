import { describe, expect, it } from "vitest";
import {
  SCALE_MARGIN,
  VOLUME_SCALE_MARGINS,
  chartOptions,
  chartPalette,
  indexPriceFormat,
  priceScaleMargins,
} from "@/registry/voraui/fear-greed-index-chart/lib/chart-options";

describe("priceScaleMargins", () => {
  it("lifts the price minimum clear of the plot floor the index zones rest on", () => {
    const margins = priceScaleMargins(false);
    expect(margins.top).toBe(SCALE_MARGIN);
    expect(margins.bottom).toBeGreaterThanOrEqual(SCALE_MARGIN + 0.05);
  });

  it("keeps the price line above the volume histogram when volume is drawn", () => {
    const volumeTop = 1 - VOLUME_SCALE_MARGINS.top;
    const margins = priceScaleMargins(true);
    expect(margins.top).toBe(SCALE_MARGIN);
    expect(margins.bottom).toBeGreaterThanOrEqual(volumeTop + 0.05);
  });
});

describe("chartOptions", () => {
  it("draws axis labels in the host app's font when one is given", () => {
    const options = chartOptions(chartPalette("light"), 800, 420, '"Geist", sans-serif');
    expect(options.layout?.fontFamily).toBe('"Geist", sans-serif');
  });

  it("keeps the library's default font when the host font is unknown", () => {
    expect(chartOptions(chartPalette("light"), 800, 420).layout).not.toHaveProperty("fontFamily");
    expect(chartOptions(chartPalette("light"), 800, 420, "").layout).not.toHaveProperty("fontFamily");
  });

  it("draws no attribution logo over the plot", () => {
    expect(chartOptions(chartPalette("light"), 800, 420).layout?.attributionLogo).toBe(false);
  });
});

describe("indexPriceFormat", () => {
  const format = indexPriceFormat(12).formatter;

  it("labels the latest value and the ticks clear of it as whole numbers", () => {
    expect(format(12)).toBe("12");
    expect(format(20)).toBe("20");
    expect(format(0)).toBe("0");
    expect(format(100)).toBe("100");
  });

  it("blanks a tick the latest-value label would half cover", () => {
    expect(format(10)).toBe("");
    expect(indexPriceFormat(47).formatter(50)).toBe("");
    expect(indexPriceFormat(45).formatter(50)).toBe("50");
  });
});
