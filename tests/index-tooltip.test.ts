import { describe, expect, it } from "vitest";
import {
  compactUsd,
  compactUsdTick,
  getIndexTooltipPosition,
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

  it("labels the zero tick of the linear price axis as $0", () => {
    expect(compactUsdTick(0)).toBe("$0");
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

describe("getIndexTooltipPosition", () => {
  const tooltip = { width: 140, height: 60 };
  const container = { width: 720, height: 420 };

  it("sits 12px right of and above the cursor, in container coordinates", () => {
    expect(getIndexTooltipPosition({ x: 200, y: 200 }, 0, tooltip, container)).toEqual({
      left: 212,
      top: 128,
    });
  });

  it("shifts by the pane's left offset so it never covers the hovered point", () => {
    expect(getIndexTooltipPosition({ x: 200, y: 200 }, 60, tooltip, container)).toEqual({
      left: 272,
      top: 128,
    });
  });

  it("flips left of the cursor when it would overflow the right edge", () => {
    // Cursor at container x 640: 652 + 140 overflows 720, so it goes to 640 - 140 - 12.
    expect(getIndexTooltipPosition({ x: 580, y: 200 }, 60, tooltip, container).left).toBe(488);
    expect(getIndexTooltipPosition({ x: 640, y: 200 }, 0, tooltip, container).left).toBe(488);
  });

  it("flips below the cursor when it would overflow the top edge", () => {
    expect(getIndexTooltipPosition({ x: 200, y: 30 }, 0, tooltip, container).top).toBe(42);
  });

  it("never leaves the container", () => {
    const small = { width: 160, height: 100 };
    for (const paneLeft of [0, 60]) {
      for (const point of [
        { x: 0, y: 0 },
        { x: 100, y: 99 },
        { x: 159, y: 50 },
        { x: 80, y: 0 },
      ]) {
        const pos = getIndexTooltipPosition(point, paneLeft, tooltip, small);
        expect(pos.left).toBeGreaterThanOrEqual(0);
        expect(pos.top).toBeGreaterThanOrEqual(0);
        expect(pos.left + tooltip.width).toBeLessThanOrEqual(small.width);
        expect(pos.top + tooltip.height).toBeLessThanOrEqual(small.height);
      }
    }
    const pos = getIndexTooltipPosition({ x: 700, y: 410 }, 0, tooltip, container);
    expect(pos.left + tooltip.width).toBeLessThanOrEqual(container.width);
    expect(pos.top + tooltip.height).toBeLessThanOrEqual(container.height);
  });
});
