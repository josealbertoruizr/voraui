# Hero Full-Viewport + Flickering Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing page hero fill the first viewport with vertically centered content, and add a subtle theme-aware animated "flickering grid" canvas background behind it.

**Architecture:** A new standalone, self-contained decorative component (`components/site/flickering-grid.tsx`) exposes pure, unit-tested helper functions (grid layout, radial falloff, opacity stepping) plus a client component that drives a `<canvas>` with `requestAnimationFrame`. `app/page.tsx` is restructured so the hero is its own `relative`, viewport-height section with the grid absolutely positioned behind the centered content column.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, vitest (node environment) for tests, plain Canvas 2D API (no new dependency).

## Global Constraints

- No new npm dependency - the flickering grid is hand-written, not a vendored Magic UI package.
- Tests live in `tests/*.test.ts` and run under vitest's `node` environment (see `vitest.config.ts:6`) - no jsdom, so component tests use `react-dom/server`'s `renderToStaticMarkup` for markup assertions only, and pure logic is factored into standalone exported functions so it's testable without any DOM/canvas.
- Package manager is `pnpm` (see `pnpm-lock.yaml`).
- Must not regress the existing `#showcase` anchor scroll (`scroll-mt-20` on the Showcase section in `app/page.tsx`).
- Component must respect `prefers-reduced-motion: reduce` (render a static frame, no RAF loop).
- Grid color must derive from CSS `currentColor` so it works in both light and dark themes with no theme-detection branching in the component.

---

### Task 1: `FlickeringGrid` component with unit-tested pure helpers

**Files:**
- Create: `components/site/flickering-grid.tsx`
- Test: `tests/flickering-grid.test.ts`

**Interfaces:**
- Produces: `buildGrid(width: number, height: number, cellSize: number): GridCell[]` where `GridCell = { cx: number; cy: number }`.
- Produces: `radialFalloff(cx: number, cy: number, width: number, height: number): number` returning a value in `[0, 1]`.
- Produces: `stepOpacity(current: number, min?: number, max?: number, step?: number, rand?: () => number): number` (defaults: `min=0`, `max=0.35`, `step=0.05`, `rand=Math.random`).
- Produces: `FlickeringGrid({ className }: { className?: string })` - a React client component rendering `<div aria-hidden class="pointer-events-none text-foreground {className}"><canvas class="block h-full w-full" /></div>`.
- Consumes: `cn` from `@/lib/utils` (already used across the codebase, e.g. `registry/voraui/trading-chart/trading-chart-skeleton.tsx:4`).

- [ ] **Step 1: Write the failing tests**

Create `tests/flickering-grid.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run tests/flickering-grid.test.ts`
Expected: FAIL - `components/site/flickering-grid.tsx` does not exist (module resolution error).

- [ ] **Step 3: Implement `components/site/flickering-grid.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const CELL_SIZE = 8;
const SQUARE_SIZE = 4;
const MAX_OPACITY = 0.35;
const MIN_OPACITY = 0;
const FLICKER_STEP = 0.05;

export interface GridCell {
  cx: number;
  cy: number;
}

/** Centers of an evenly spaced square grid covering a width x height area,
 *  `cellSize` apart, starting at half-pitch so the grid isn't clipped at the top/left edge. */
export function buildGrid(width: number, height: number, cellSize: number): GridCell[] {
  if (width <= 0 || height <= 0 || cellSize <= 0) return [];
  const cells: GridCell[] = [];
  for (let cy = cellSize / 2; cy < height; cy += cellSize) {
    for (let cx = cellSize / 2; cx < width; cx += cellSize) {
      cells.push({ cx, cy });
    }
  }
  return cells;
}

/** Radial falloff multiplier in [0, 1]: 1 at the canvas center, tapering
 *  linearly to 0 at the distance from center to the nearest edge. */
export function radialFalloff(cx: number, cy: number, width: number, height: number): number {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.min(centerX, centerY);
  if (maxDist <= 0) return 0;
  const dist = Math.hypot(cx - centerX, cy - centerY);
  return Math.max(0, 1 - dist / maxDist);
}

/** One random-walk opacity step, clamped to [min, max]. `rand` is injectable
 *  for deterministic testing; defaults to Math.random. */
export function stepOpacity(
  current: number,
  min = MIN_OPACITY,
  max = MAX_OPACITY,
  step = FLICKER_STEP,
  rand: () => number = Math.random,
): number {
  const delta = (rand() * 2 - 1) * step;
  return Math.min(max, Math.max(min, current + delta));
}

export interface FlickeringGridProps {
  className?: string;
}

export function FlickeringGrid({ className }: FlickeringGridProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cells: GridCell[] = [];
    let opacities: number[] = [];
    let width = 0;
    let height = 0;
    let rafId = 0;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);
      cells = buildGrid(width, height, CELL_SIZE);
      opacities = cells.map(() => Math.random() * MAX_OPACITY);
      draw();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const color = getComputedStyle(canvas!).color;
      cells.forEach((cell, i) => {
        const falloff = radialFalloff(cell.cx, cell.cy, width, height);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = opacities[i] * falloff;
        ctx!.fillRect(cell.cx - SQUARE_SIZE / 2, cell.cy - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
      });
      ctx!.globalAlpha = 1;
    }

    function tick() {
      opacities = opacities.map((o) => stepOpacity(o));
      draw();
      rafId = requestAnimationFrame(tick);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    if (!reduceMotion) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={cn("pointer-events-none text-foreground", className)} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run tests/flickering-grid.test.ts`
Expected: PASS - all 9 tests green.

- [ ] **Step 5: Run the full test suite and lint to check for regressions**

Run: `pnpm test && pnpm lint`
Expected: All existing tests still PASS; lint reports no errors.

- [ ] **Step 6: Commit**

```bash
git add components/site/flickering-grid.tsx tests/flickering-grid.test.ts
git commit -m "feat: add FlickeringGrid decorative background component"
```

---

### Task 2: Wire the full-viewport hero into `app/page.tsx`

**Files:**
- Modify: `app/page.tsx:1-27` (imports and hero section)

**Interfaces:**
- Consumes: `FlickeringGrid` from `@/components/site/flickering-grid` (Task 1).
- Consumes: `h-14` (3.5rem) sticky header height from `components/site/site-header.tsx:6`.

- [ ] **Step 1: Add the import**

In `app/page.tsx`, add to the top import block (after the `TechStack` import):

```tsx
import { FlickeringGrid } from "@/components/site/flickering-grid";
```

- [ ] **Step 2: Replace the hero section markup**

Replace:

```tsx
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Crypto analytics components
          <br />
          for shadcn/ui
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Open source, install-and-go market components. Real data out of the box from free public
          APIs, full control via props in production.
        </p>
        <div className="flex justify-center">
          <Button render={<a href="#showcase" />} nativeButton={false} size="lg" className="rounded-full">
            Browse Components
          </Button>
        </div>
        <TechStack />
      </section>
```

with:

```tsx
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden">
        <FlickeringGrid className="absolute inset-0 -z-10" />
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Crypto analytics components
            <br />
            for shadcn/ui
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Open source, install-and-go market components. Real data out of the box from free public
            APIs, full control via props in production.
          </p>
          <div className="flex justify-center">
            <Button render={<a href="#showcase" />} nativeButton={false} size="lg" className="rounded-full">
              Browse Components
            </Button>
          </div>
          <TechStack />
        </div>
      </section>
```

Leave the `Showcase` `<section id="showcase" ...>` below it completely unchanged.

- [ ] **Step 3: Run the full test suite and lint**

Run: `pnpm test && pnpm lint`
Expected: All tests PASS; lint reports no errors.

- [ ] **Step 4: Manual browser verification**

Run: `pnpm dev`, open `http://localhost:3000`.

- Confirm the hero (title, subtitle, button, tech icons) is vertically centered and the Showcase heading is not visible without scrolling, at both ~1440x900 and ~1280x800 viewport sizes.
- Toggle the theme switcher (top right) and confirm the flickering grid is visible-but-subtle in both light and dark mode, and doesn't reduce text legibility.
- Open devtools, enable "emulate CSS prefers-reduced-motion: reduce", reload, and confirm the grid renders as a static (non-animating) frame.
- Resize the browser window and confirm the canvas redraws crisply (no blurriness, no stale/cut-off grid).
- Click "Browse Components" and confirm it still scrolls to the Showcase section correctly.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: make landing page hero full-viewport with flickering grid background"
```
