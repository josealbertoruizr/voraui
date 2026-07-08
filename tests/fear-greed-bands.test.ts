import { describe, expect, it } from "vitest";
import {
  DEFAULT_FEAR_GREED_BANDS,
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  GRADIENT_STOPS,
  angleForValue,
  arcPoint,
  colorForValue,
  describeArc,
  describeWedge,
  findFearGreedBand,
} from "@/registry/voraui/fear-greed-gauge/fear-greed-bands";

describe("angleForValue", () => {
  it("maps 0 to 180 degrees (left) and 100 to 0 degrees (right)", () => {
    expect(angleForValue(0)).toBe(180);
    expect(angleForValue(100)).toBe(0);
  });

  it("maps 50 to 90 degrees (top)", () => {
    expect(angleForValue(50)).toBe(90);
  });

  it("clamps out-of-range values", () => {
    expect(angleForValue(-10)).toBe(180);
    expect(angleForValue(150)).toBe(0);
  });
});

describe("arcPoint", () => {
  it("places value 0 at the leftmost point of the circle", () => {
    const p = arcPoint(90, 0);
    expect(p.x).toBeCloseTo(GAUGE_CENTER_X - 90, 6);
    expect(p.y).toBeCloseTo(GAUGE_CENTER_Y, 6);
  });

  it("places value 100 at the rightmost point of the circle", () => {
    const p = arcPoint(90, 100);
    expect(p.x).toBeCloseTo(GAUGE_CENTER_X + 90, 6);
    expect(p.y).toBeCloseTo(GAUGE_CENTER_Y, 6);
  });

  it("places value 50 at the top of the circle", () => {
    const p = arcPoint(90, 50);
    expect(p.x).toBeCloseTo(GAUGE_CENTER_X, 6);
    expect(p.y).toBeCloseTo(GAUGE_CENTER_Y - 90, 6);
  });
});

describe("describeArc", () => {
  it("starts and ends at the expected points for the full 0-100 range", () => {
    const d = describeArc(90, 0, 100);
    expect(d).toBe(
      `M ${GAUGE_CENTER_X - 90} ${GAUGE_CENTER_Y} A 90 90 0 0 1 ${GAUGE_CENTER_X + 90} ${GAUGE_CENTER_Y}`,
    );
  });
});

describe("colorForValue", () => {
  it("returns each stop's exact color at its own value", () => {
    for (const stop of GRADIENT_STOPS) {
      expect(colorForValue(stop.value)).toBe(stop.color);
    }
  });

  it("interpolates linearly between two adjacent stops", () => {
    // Midpoint between #c0392b (192,57,43) and #e0672b (224,103,43):
    // (208, 80, 43) -> #d0502b.
    expect(colorForValue(12.5)).toBe("#d0502b");
  });

  it("clamps out-of-range values to the nearest edge stop's color", () => {
    expect(colorForValue(-10)).toBe(GRADIENT_STOPS[0].color);
    expect(colorForValue(150)).toBe(GRADIENT_STOPS.at(-1)!.color);
  });
});

describe("describeWedge", () => {
  it("builds a closed annular sector path between two radii and values", () => {
    const d = describeWedge(100, 60, 0, 50);
    expect(d).toBe(
      `M ${GAUGE_CENTER_X - 100} ${GAUGE_CENTER_Y} A 100 100 0 0 1 ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y - 100} ` +
        `L ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y - 60} A 60 60 0 0 0 ${GAUGE_CENTER_X - 60} ${GAUGE_CENTER_Y} Z`,
    );
  });
});

describe("findFearGreedBand", () => {
  it("returns the matching band for a value inside each range", () => {
    expect(findFearGreedBand(10).key).toBe("extreme-fear");
    expect(findFearGreedBand(30).key).toBe("fear");
    expect(findFearGreedBand(50).key).toBe("neutral");
    expect(findFearGreedBand(65).key).toBe("greed");
    expect(findFearGreedBand(90).key).toBe("extreme-greed");
  });

  it("clamps out-of-range values into the nearest edge band", () => {
    expect(findFearGreedBand(-5).key).toBe("extreme-fear");
    expect(findFearGreedBand(120).key).toBe("extreme-greed");
  });
});

describe("DEFAULT_FEAR_GREED_BANDS", () => {
  it("ships exactly 5 bands covering 0-100 with no gaps or overlaps", () => {
    expect(DEFAULT_FEAR_GREED_BANDS).toHaveLength(5);
    expect(DEFAULT_FEAR_GREED_BANDS[0].min).toBe(0);
    expect(DEFAULT_FEAR_GREED_BANDS.at(-1)!.max).toBe(100);
    for (let i = 1; i < DEFAULT_FEAR_GREED_BANDS.length; i++) {
      expect(DEFAULT_FEAR_GREED_BANDS[i].min).toBe(DEFAULT_FEAR_GREED_BANDS[i - 1].max + 1);
    }
  });
});
