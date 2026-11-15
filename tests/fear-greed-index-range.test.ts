import { describe, expect, it } from "vitest";
import {
  LABEL_GUTTER_MIN_PLOT_WIDTH,
  clampLogicalRange,
  distinctTimeCount,
  labelGutterPixels,
  minBarSpacingFor,
  presetLogicalRange,
  tickDetailFor,
  tickLabelFor,
} from "@/registry/voraui/fear-greed-index-chart/lib/chart-range";

describe("labelGutterPixels", () => {
  it("reserves a label column right of the latest day on wide plots", () => {
    expect(labelGutterPixels(LABEL_GUTTER_MIN_PLOT_WIDTH)).toBe(92);
    expect(labelGutterPixels(1200)).toBe(92);
  });

  it("reserves nothing on narrow plots, where the labels are hidden", () => {
    expect(labelGutterPixels(LABEL_GUTTER_MIN_PLOT_WIDTH - 1)).toBe(0);
    expect(labelGutterPixels(200)).toBe(0);
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

describe("clampLogicalRange", () => {
  // 100 bars (0..99) with 5 bars of right padding: the range may span -0.5..104.
  it("leaves a range inside the bounds untouched", () => {
    expect(clampLogicalRange({ from: 10, to: 60 }, 100, 5)).toEqual({ from: 10, to: 60 });
  });

  it("tolerates sub-bar overshoot so the chart's own edge correction cannot loop", () => {
    expect(clampLogicalRange({ from: -0.9, to: 50 }, 100, 5)).toEqual({ from: -0.9, to: 50 });
    expect(clampLogicalRange({ from: 60, to: 104.4 }, 100, 5)).toEqual({ from: 60, to: 104.4 });
  });

  it("shifts a range dragged past the padding back, keeping its span", () => {
    expect(clampLogicalRange({ from: 80, to: 130 }, 100, 5)).toEqual({ from: 54, to: 104 });
  });

  it("shifts a range dragged before the first bar forward, keeping its span", () => {
    expect(clampLogicalRange({ from: -20, to: 30 }, 100, 5)).toEqual({ from: -0.5, to: 49.5 });
  });

  it("fits everything when the span exceeds all bars plus padding", () => {
    expect(clampLogicalRange({ from: -50, to: 200 }, 100, 5)).toEqual({ from: -0.5, to: 104 });
    expect(clampLogicalRange({ from: 20, to: 300 }, 100, 5)).toEqual({ from: -0.5, to: 104 });
  });

  it("returns the range as is when there are no bars", () => {
    expect(clampLogicalRange({ from: 3, to: 9 }, 0, 5)).toEqual({ from: 3, to: 9 });
  });
});

describe("distinctTimeCount", () => {
  it("counts the union of times across series, not the longest one", () => {
    const index = [{ time: 1 }, { time: 2 }, { time: 3 }];
    const btc = [{ time: 1.5 }, { time: 2 }, { time: 2.5 }];
    expect(distinctTimeCount([index, btc, btc])).toBe(5);
  });

  it("matches the series length when the times align", () => {
    const index = [{ time: 1 }, { time: 2 }];
    expect(distinctTimeCount([index, index, []])).toBe(2);
    expect(distinctTimeCount([[], []])).toBe(0);
  });
});

describe("tickDetailFor", () => {
  it("labels only years while a year is too narrow to fit month labels", () => {
    expect(tickDetailFor(0.16)).toBe("year");
    expect(tickDetailFor(0.38)).toBe("year");
  });

  it("adds months once a year is wide enough, and days once a month is", () => {
    expect(tickDetailFor(0.5)).toBe("month");
    expect(tickDetailFor(2.25)).toBe("month");
    expect(tickDetailFor(6)).toBe("day");
    expect(tickDetailFor(27)).toBe("day");
  });
});

describe("tickLabelFor", () => {
  // 0 = Year, 1 = Month, 2 = DayOfMonth in lightweight-charts' TickMarkType.
  it("blanks the stray month and day marks that fill gaps between coarser ones", () => {
    expect(tickLabelFor(1, "year")).toBe("");
    expect(tickLabelFor(2, "year")).toBe("");
    expect(tickLabelFor(2, "month")).toBe("");
  });

  it("defers to the default label for marks at or above the current detail", () => {
    expect(tickLabelFor(0, "year")).toBeNull();
    expect(tickLabelFor(0, "month")).toBeNull();
    expect(tickLabelFor(1, "month")).toBeNull();
    expect(tickLabelFor(2, "day")).toBeNull();
  });
});
