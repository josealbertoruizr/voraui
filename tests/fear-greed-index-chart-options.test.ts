import { describe, expect, it } from "vitest";
import {
  SCALE_MARGIN,
  VOLUME_SCALE_MARGINS,
  chartOptions,
  chartPalette,
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
  it("draws no attribution logo over the plot", () => {
    expect(chartOptions(chartPalette("light"), 800, 420).layout?.attributionLogo).toBe(false);
  });
});
