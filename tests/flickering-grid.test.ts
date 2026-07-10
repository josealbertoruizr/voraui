import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildGrid, radialFalloff, stepOpacity, FlickeringGrid } from "@/components/site/flickering-grid";

describe("buildGrid", () => {
  it("returns an empty array for non-positive dimensions", () => {
    expect(buildGrid(0, 100, 8)).toEqual([]);
    expect(buildGrid(100, 0, 8)).toEqual([]);
    expect(buildGrid(100, 100, 0)).toEqual([]);
  });

  it("spaces cells evenly at the given cell size, starting at half-pitch", () => {
    const cells = buildGrid(24, 8, 8);
    expect(cells).toEqual([
      { cx: 4, cy: 4 },
      { cx: 12, cy: 4 },
      { cx: 20, cy: 4 },
    ]);
  });
});

describe("radialFalloff", () => {
  it("is 1 at the exact center", () => {
    expect(radialFalloff(50, 50, 100, 100)).toBe(1);
  });

  it("is 0 at the nearest edge midpoint and beyond", () => {
    expect(radialFalloff(0, 50, 100, 100)).toBe(0);
    expect(radialFalloff(-20, 50, 100, 100)).toBe(0);
  });

  it("decreases monotonically with distance from center", () => {
    const near = radialFalloff(60, 50, 100, 100);
    const far = radialFalloff(90, 50, 100, 100);
    expect(near).toBeGreaterThan(far);
    expect(near).toBeLessThan(1);
    expect(far).toBeGreaterThan(0);
  });
});

describe("stepOpacity", () => {
  it("clamps to max when the random step pushes upward past the ceiling", () => {
    expect(stepOpacity(0.34, 0, 0.35, 0.05, () => 1)).toBe(0.35);
  });

  it("clamps to min when the random step pushes downward past the floor", () => {
    expect(stepOpacity(0.01, 0, 0.35, 0.05, () => 0)).toBe(0);
  });

  it("applies zero delta for a midpoint random value", () => {
    expect(stepOpacity(0.2, 0, 0.35, 0.05, () => 0.5)).toBeCloseTo(0.2, 5);
  });
});

describe("FlickeringGrid", () => {
  it("renders an aria-hidden, pointer-events-none wrapper with a canvas", () => {
    const html = renderToStaticMarkup(React.createElement(FlickeringGrid, {}));
    expect(html).toContain("aria-hidden");
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("<canvas");
  });

  it("forwards the className to the wrapper element", () => {
    const html = renderToStaticMarkup(React.createElement(FlickeringGrid, { className: "absolute inset-0 -z-10" }));
    expect(html).toContain("absolute inset-0 -z-10");
  });
});
