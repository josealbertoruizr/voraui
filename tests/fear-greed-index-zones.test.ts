import { describe, expect, it } from "vitest";
import {
  LABEL_GUTTER_MIN_WIDTH,
  labelGutterPixels,
  minBarSpacingFor,
  presetLogicalRange,
} from "@/registry/voraui/fear-greed-index-chart/lib/zones-primitive";

describe("labelGutterPixels", () => {
  it("reserves a label column right of the latest day on wide charts", () => {
    expect(labelGutterPixels(LABEL_GUTTER_MIN_WIDTH)).toBe(92);
    expect(labelGutterPixels(1200)).toBe(92);
  });

  it("keeps only a small offset on narrow charts so the plot is not squeezed", () => {
    expect(labelGutterPixels(LABEL_GUTTER_MIN_WIDTH - 1)).toBe(8);
    expect(labelGutterPixels(320)).toBe(8);
  });
});

describe("gutter-aware time scale helpers", () => {
  it("extends a preset's logical range so the last day ends at the label gutter", () => {
    const range = presetLogicalRange(100, 130, 720, 92);
    expect(range.from).toBe(100);
    // 30 bars across 628px leaves 92px, i.e. 92 / (628 / 30) extra bars.
    expect(range.to).toBeCloseTo(130 + (92 * 30) / 628, 6);
  });

  it("keeps the plain range when there is no gutter or no room", () => {
    expect(presetLogicalRange(0, 10, 720, 0)).toEqual({ from: 0, to: 10 });
    expect(presetLogicalRange(0, 10, 80, 92)).toEqual({ from: 0, to: 10 });
  });

  it("caps zoom-out so every day plus the gutter just fits", () => {
    expect(minBarSpacingFor(720, 92, 2_000)).toBeCloseTo(628 / 2_000, 6);
    expect(minBarSpacingFor(720, 92, 0)).toBe(0.5);
    expect(minBarSpacingFor(60, 92, 100)).toBe(0.5);
  });
});
