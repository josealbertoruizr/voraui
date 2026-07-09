# Component Skeleton Loading States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `Loader2` spinner loading state in all four Vora UI registry components with shaped-ghost skeletons that mirror each component's real geometry, animated with a CSS shimmer sweep.

**Architecture:** Each registry item gets one new self-contained skeleton file (`<name>-skeleton.tsx`) exporting a standalone component. The main component renders it automatically on its `loading` branch; users can also import it directly (e.g. for a React Suspense fallback). No shared skeleton primitive and no new runtime dependency - the shimmer CSS is duplicated per file so every item stays independently installable via `npx shadcn add`.

**Tech Stack:** React 19.2 (`<style href precedence>` for de-duplicated, SSR-safe keyframe injection - no `useEffect`, no new dependency), Tailwind v4 utility classes, existing `cn()` helper. Tests use `react-dom/server`'s `renderToStaticMarkup` inside the project's existing Node-environment Vitest setup (no jsdom/RTL - confirmed working via a spike; see Global Constraints).

## Global Constraints

- Every skeleton's root element carries `role="status"` and an `sr-only` "Loading ..." label matching the real component's existing accessibility copy exactly (verified against current source: "Loading Fear & Greed Index", "Loading Altseason Index", "Loading BTC price history", "Loading market data").
- Every skeleton uses the identical viewBox / height / max-width as its real component's loaded layout, so swapping loading -> loaded produces zero layout shift.
- The shimmer sweep is pure CSS (`@keyframes` inside a `<style href="..." precedence="low">` tag, one unique `href` per file) - no JS animation library, no `useEffect` DOM injection. It is disabled via `@media (prefers-reduced-motion: reduce)`.
- No new npm dependency is introduced. `lucide-react`'s `Loader2` is removed from all four components; drop `"lucide-react"` from each item's `dependencies` array in `registry.json` once confirmed unused elsewhere in that item (verified: it is not).
- No new registry item and no new `registryDependencies` entry - each skeleton file lives inside its own item's folder and is added to that item's `files` array in `registry.json` as `type: "registry:component"`.
- Tests live in `tests/*.test.ts` (the existing Vitest `include` glob) and render components via `React.createElement` + `renderToStaticMarkup` - never JSX-in-`.ts` and never a new testing-library dependency.

---

### Task 1: FearGreedGaugeSkeleton

**Files:**
- Modify: `registry/voraui/fear-greed-gauge/fear-greed-bands.ts`
- Modify: `registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx`
- Create: `registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton.tsx`
- Modify: `registry.json`
- Modify: `tests/registry.test.ts`
- Modify: `app/docs/fear-greed-gauge/page.tsx`
- Test: `tests/fear-greed-gauge-skeleton.test.ts`

**Interfaces:**
- Produces: `FearGreedGaugeSkeleton({ variant?: "minimal" | "ticks" | "gradient" | "wedges"; className?: string })` from `./fear-greed-gauge-skeleton`, and new exports from `fear-greed-bands.ts`: `WEDGE_OUTER_RADIUS`, `WEDGE_INNER_RADIUS`, `WEDGE_GAP`, `WEDGE_HUB_RADIUS`, `WEDGES_VIEWBOX_HEIGHT` (all `number`).

- [ ] **Step 1: Move the wedge-geometry constants into `fear-greed-bands.ts` so both the real gauge and its skeleton share one source of truth**

Append to the end of `registry/voraui/fear-greed-gauge/fear-greed-bands.ts`:

```ts

// "wedges" variant geometry, shared with FearGreedGaugeSkeleton so the ghost
// dial lines up exactly with the real one.
export const WEDGE_OUTER_RADIUS = 104;
export const WEDGE_INNER_RADIUS = 64;
export const WEDGE_GAP = 1.2;
export const WEDGE_HUB_RADIUS = 40;
// Tall enough for the full hub circle (center y 130 + radius 40) plus a small
// bottom margin; also the denominator for the centered value overlay's top %.
export const WEDGES_VIEWBOX_HEIGHT = 180;
```

In `registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx`, replace the import block (lines 8-20):

```ts
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
  equalizedValue,
  findFearGreedBand,
} from "./fear-greed-bands";
```

with:

```ts
import {
  DEFAULT_FEAR_GREED_BANDS,
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  GRADIENT_STOPS,
  WEDGE_GAP,
  WEDGE_HUB_RADIUS,
  WEDGE_INNER_RADIUS,
  WEDGE_OUTER_RADIUS,
  WEDGES_VIEWBOX_HEIGHT,
  angleForValue,
  arcPoint,
  colorForValue,
  describeArc,
  describeWedge,
  equalizedValue,
  findFearGreedBand,
} from "./fear-greed-bands";
```

Then replace the local wedge-constants block (lines 36-59):

```ts
// "wedges" variant: pie-slice zone sectors instead of a thin arc, with the
// zone matching the current value highlighted and the rest neutral gray.
const WEDGE_OUTER_RADIUS = 104;
const WEDGE_INNER_RADIUS = 64;
const WEDGE_GAP = 1.2;
const WEDGE_LABEL_RADIUS = (WEDGE_OUTER_RADIUS + WEDGE_INNER_RADIUS) / 2;
const WEDGE_BAND_SHARE = 100 / DEFAULT_FEAR_GREED_BANDS.length;
// With equalized wedges every wedge corner is a real band boundary, so the
// scale numbers sit at the corners and each zone's true value range reads
// straight off the dial (neutral between 45 and 55, greed 55-75, ...).
const WEDGE_SCALE_NUMBER_VALUES = [0, 25, 45, 55, 75, 100];
// Two decorative dots per zone, at thirds between the corner numbers. They
// mark display positions, not round values: the dial is equalized per band
// (see equalizedValue), so in-between values don't land on round angles.
const WEDGE_SCALE_DOT_DISPLAY_VALUES = DEFAULT_FEAR_GREED_BANDS.flatMap((_, i) => [
  (i + 1 / 3) * WEDGE_BAND_SHARE,
  (i + 2 / 3) * WEDGE_BAND_SHARE,
]);
const WEDGE_SCALE_DOT_RADIUS = 48;
const WEDGE_SCALE_NUMBER_RADIUS = 56;
const WEDGE_HUB_RADIUS = 40;
// Tall enough for the full hub circle (center y 130 + radius 40) plus a small
// bottom margin; also the denominator for the centered value overlay's top %.
const WEDGES_VIEWBOX_HEIGHT = 180;
```

with:

```ts
// "wedges" variant: pie-slice zone sectors instead of a thin arc, with the
// zone matching the current value highlighted and the rest neutral gray.
const WEDGE_LABEL_RADIUS = (WEDGE_OUTER_RADIUS + WEDGE_INNER_RADIUS) / 2;
const WEDGE_BAND_SHARE = 100 / DEFAULT_FEAR_GREED_BANDS.length;
// With equalized wedges every wedge corner is a real band boundary, so the
// scale numbers sit at the corners and each zone's true value range reads
// straight off the dial (neutral between 45 and 55, greed 55-75, ...).
const WEDGE_SCALE_NUMBER_VALUES = [0, 25, 45, 55, 75, 100];
// Two decorative dots per zone, at thirds between the corner numbers. They
// mark display positions, not round values: the dial is equalized per band
// (see equalizedValue), so in-between values don't land on round angles.
const WEDGE_SCALE_DOT_DISPLAY_VALUES = DEFAULT_FEAR_GREED_BANDS.flatMap((_, i) => [
  (i + 1 / 3) * WEDGE_BAND_SHARE,
  (i + 2 / 3) * WEDGE_BAND_SHARE,
]);
const WEDGE_SCALE_DOT_RADIUS = 48;
const WEDGE_SCALE_NUMBER_RADIUS = 56;
```

- [ ] **Step 2: Run the existing fear-greed test to confirm nothing broke**

Run: `npx vitest run tests/fear-greed-bands.test.ts tests/fear-greed.test.ts`
Expected: PASS (both files still test pure functions, unaffected by the export move).

- [ ] **Step 3: Write the failing skeleton + wiring test**

Create `tests/fear-greed-gauge-skeleton.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FearGreedGaugeSkeleton } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton";
import { FearGreedGauge } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge";

describe("FearGreedGaugeSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(FearGreedGaugeSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading Fear &amp; Greed Index");
  });

  it("draws wedge paths for the wedges variant and a single arc for the others", () => {
    const wedges = renderToStaticMarkup(React.createElement(FearGreedGaugeSkeleton, { variant: "wedges" }));
    const gradient = renderToStaticMarkup(React.createElement(FearGreedGaugeSkeleton, { variant: "gradient" }));
    expect((wedges.match(/<path/g) ?? []).length).toBe(5);
    expect((gradient.match(/<path/g) ?? []).length).toBe(1);
  });
});

describe("FearGreedGauge loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(FearGreedGauge, {}));
    expect(html).toContain("voraui-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run tests/fear-greed-gauge-skeleton.test.ts`
Expected: FAIL - `Cannot find module '@/registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton'`.

- [ ] **Step 5: Create the skeleton component**

Create `registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton.tsx`:

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  WEDGE_GAP,
  WEDGE_HUB_RADIUS,
  WEDGE_INNER_RADIUS,
  WEDGE_OUTER_RADIUS,
  WEDGES_VIEWBOX_HEIGHT,
  describeArc,
  describeWedge,
} from "./fear-greed-bands";

export interface FearGreedGaugeSkeletonProps {
  /** Matches FearGreedGaugeProps["variant"] so the ghost lines up with the real dial. */
  variant?: "minimal" | "ticks" | "gradient" | "wedges";
  className?: string;
}

const WEDGE_COUNT = 5;

export function FearGreedGaugeSkeleton({ variant = "gradient", className }: FearGreedGaugeSkeletonProps) {
  const isWedges = variant === "wedges";

  return (
    <div
      role="status"
      className={cn("voraui-skeleton-shimmer relative flex flex-col items-center overflow-hidden", className)}
    >
      <style href="voraui-fear-greed-gauge-skeleton" precedence="low">{`
        @keyframes voraui-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: voraui-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="relative w-full max-w-[300px]">
        <svg
          viewBox={isWedges ? `0 0 260 ${WEDGES_VIEWBOX_HEIGHT}` : "0 0 260 158"}
          className="w-full"
          aria-hidden="true"
        >
          {isWedges ? (
            Array.from({ length: WEDGE_COUNT }, (_, i) => {
              const share = 100 / WEDGE_COUNT;
              const from = i * share + WEDGE_GAP;
              const to = (i + 1) * share - WEDGE_GAP;
              return (
                <path
                  key={i}
                  d={describeWedge(WEDGE_OUTER_RADIUS, WEDGE_INNER_RADIUS, from, to)}
                  className="fill-muted"
                />
              );
            })
          ) : (
            <path
              d={describeArc(90, 0, 100)}
              fill="none"
              stroke="currentColor"
              strokeWidth={12}
              strokeLinecap="round"
              className="text-muted"
            />
          )}
          <polygon
            points={`${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X},${GAUGE_CENTER_Y - 72} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y - 66} ${GAUGE_CENTER_X + 2.2},${GAUGE_CENTER_Y + 15} ${GAUGE_CENTER_X - 2.2},${GAUGE_CENTER_Y + 15}`}
            className="fill-muted-foreground/40"
          />
          {isWedges && (
            <circle
              cx={GAUGE_CENTER_X}
              cy={GAUGE_CENTER_Y}
              r={WEDGE_HUB_RADIUS}
              strokeWidth={1}
              className="fill-background stroke-border"
            />
          )}
        </svg>
        {isWedges && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${(GAUGE_CENTER_Y / WEDGES_VIEWBOX_HEIGHT) * 100}%` }}
          >
            <div className="mx-auto h-8 w-14 rounded-md bg-muted" />
          </div>
        )}
      </div>
      {!isWedges && (
        <div className="-mt-4 flex flex-col items-center gap-2 pb-[1px]">
          <div className="h-9 w-16 rounded-md bg-muted" />
          <div className="h-3 w-20 rounded-full bg-muted" />
        </div>
      )}
      <span className="sr-only">Loading Fear &amp; Greed Index</span>
    </div>
  );
}
```

- [ ] **Step 6: Wire the skeleton into `FearGreedGauge` and remove the spinner**

In `registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx`, replace the import (line 4):

```ts
import { Loader2 } from "lucide-react";
```

with:

```ts
import { FearGreedGaugeSkeleton } from "./fear-greed-gauge-skeleton";
```

(keep its alphabetical position among the other imports - place it directly below the `NumberFlow` import and above the `cn` import, matching the existing import ordering.)

Replace the function body opening (originally lines 67-82):

```tsx
export function FearGreedGauge({ data, variant = "gradient", className }: FearGreedGaugeProps) {
  const gradientId = React.useId();
  const fetched = useFearGreed({ enabled: data === undefined });
  const resolved = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const value = resolved?.value ?? null;
  const label = resolved?.label ?? "Unknown";
  const hasError = data === undefined && Boolean(fetched.error);
  // The wedges dial is drawn in equalized display space (see equalizedValue),
  // so its needle has to go through the same remapping to land inside the
  // highlighted wedge.
  const dialValue = value !== null && variant === "wedges" ? equalizedValue(value) : value;
  const needleRotation = dialValue !== null ? 90 - angleForValue(dialValue) : 0;
  const activeBand = variant === "wedges" && value !== null ? findFearGreedBand(value) : null;

  return (
```

with:

```tsx
export function FearGreedGauge({ data, variant = "gradient", className }: FearGreedGaugeProps) {
  const gradientId = React.useId();
  const fetched = useFearGreed({ enabled: data === undefined });
  const resolved = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const value = resolved?.value ?? null;
  const label = resolved?.label ?? "Unknown";
  const hasError = data === undefined && Boolean(fetched.error);
  // The wedges dial is drawn in equalized display space (see equalizedValue),
  // so its needle has to go through the same remapping to land inside the
  // highlighted wedge.
  const dialValue = value !== null && variant === "wedges" ? equalizedValue(value) : value;
  const needleRotation = dialValue !== null ? 90 - angleForValue(dialValue) : 0;
  const activeBand = variant === "wedges" && value !== null ? findFearGreedBand(value) : null;

  if (loading) {
    return <FearGreedGaugeSkeleton variant={variant} className={className} />;
  }

  return (
```

Replace the needle condition:

```tsx
          {value !== null && !loading && (
```

with:

```tsx
          {value !== null && (
```

Replace the wedges center overlay block:

```tsx
        {variant === "wedges" && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ top: `${(GAUGE_CENTER_Y / WEDGES_VIEWBOX_HEIGHT) * 100}%` }}
          >
            {loading ? (
              <div role="status">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Loading Fear &amp; Greed Index</span>
              </div>
            ) : (
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {value !== null ? <NumberFlow value={value} /> : "-"}
                {/* The zone name is only drawn inside the aria-hidden SVG for
                    this variant, so repeat it for screen readers. */}
                {!hasError && <span className="sr-only"> {label}</span>}
              </p>
            )}
          </div>
        )}
```

with:

```tsx
        {variant === "wedges" && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ top: `${(GAUGE_CENTER_Y / WEDGES_VIEWBOX_HEIGHT) * 100}%` }}
          >
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {value !== null ? <NumberFlow value={value} /> : "-"}
              {/* The zone name is only drawn inside the aria-hidden SVG for
                  this variant, so repeat it for screen readers. */}
              {!hasError && <span className="sr-only"> {label}</span>}
            </p>
          </div>
        )}
```

Replace the non-wedges block:

```tsx
        <div className="-mt-4 text-center">
          {loading ? (
            <div role="status">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">Loading Fear &amp; Greed Index</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {value !== null ? <NumberFlow value={value} /> : "-"}
              </p>
              {hasError ? (
                <p role="alert" className="text-xs font-medium text-muted-foreground">
                  Fear &amp; Greed data is unavailable.
                </p>
              ) : (
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
              )}
            </>
          )}
        </div>
```

with:

```tsx
        <div className="-mt-4 text-center">
          <p className="text-3xl font-bold tabular-nums text-foreground">
            {value !== null ? <NumberFlow value={value} /> : "-"}
          </p>
          {hasError ? (
            <p role="alert" className="text-xs font-medium text-muted-foreground">
              Fear &amp; Greed data is unavailable.
            </p>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          )}
        </div>
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run tests/fear-greed-gauge-skeleton.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Update `registry.json`**

In `registry.json`, inside the `"fear-greed-gauge"` item, replace the `"files"` array:

```json
            "files": [
                {
                    "path": "registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/fear-greed-gauge.tsx"
                },
                {
                    "path": "registry/voraui/fear-greed-gauge/use-fear-greed.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-fear-greed.ts"
                },
                {
                    "path": "registry/voraui/fear-greed-gauge/fear-greed-bands.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/fear-greed-bands.ts"
                }
            ]
```

with:

```json
            "files": [
                {
                    "path": "registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/fear-greed-gauge.tsx"
                },
                {
                    "path": "registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/fear-greed-gauge-skeleton.tsx"
                },
                {
                    "path": "registry/voraui/fear-greed-gauge/use-fear-greed.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-fear-greed.ts"
                },
                {
                    "path": "registry/voraui/fear-greed-gauge/fear-greed-bands.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/fear-greed-bands.ts"
                }
            ]
```

Also replace, in the same item, `"dependencies": ["lucide-react", "@number-flow/react"]` with `"dependencies": ["@number-flow/react"]`.

- [ ] **Step 9: Update `tests/registry.test.ts` to match**

In `tests/registry.test.ts`, replace:

```ts
    expect(item.dependencies).toEqual(["lucide-react", "@number-flow/react"]);
    expect(item.registryDependencies).toEqual(["utils"]);
    expect(item.files).toEqual([
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/use-fear-greed.ts",
        type: "registry:hook",
        target: "components/voraui/use-fear-greed.ts",
      },
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-bands.ts",
        type: "registry:lib",
        target: "components/voraui/fear-greed-bands.ts",
      },
    ]);
```

with:

```ts
    expect(item.dependencies).toEqual(["@number-flow/react"]);
    expect(item.registryDependencies).toEqual(["utils"]);
    expect(item.files).toEqual([
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge-skeleton.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/use-fear-greed.ts",
        type: "registry:hook",
        target: "components/voraui/use-fear-greed.ts",
      },
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-bands.ts",
        type: "registry:lib",
        target: "components/voraui/fear-greed-bands.ts",
      },
    ]);
```

- [ ] **Step 10: Add a "Skeleton" section to the docs page**

In `app/docs/fear-greed-gauge/page.tsx`, add the import (below the existing `FearGreedGauge` import on line 6):

```tsx
import { FearGreedGaugeSkeleton } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton";
```

Insert a new section directly after the "Variants" `</section>` (after line 49) and before the "Installation" `<section>`:

```tsx
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          FearGreedGauge shows this shaped skeleton automatically while its bundled fetcher loads.
          Import FearGreedGaugeSkeleton directly for a React Suspense fallback or an SSR placeholder.
        </p>
        <ComponentPreview>
          <FearGreedGaugeSkeleton variant="wedges" />
        </ComponentPreview>
      </section>
```

- [ ] **Step 11: Run the full test suite and lint**

Run: `npm run test && npm run lint`
Expected: all tests PASS, lint clean.

- [ ] **Step 12: Commit**

```bash
git add registry/voraui/fear-greed-gauge/fear-greed-bands.ts \
        registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx \
        registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton.tsx \
        registry.json tests/registry.test.ts tests/fear-greed-gauge-skeleton.test.ts \
        app/docs/fear-greed-gauge/page.tsx
git commit -m "feat: add shaped skeleton loading state to FearGreedGauge"
```

---

### Task 2: AltseasonGaugeSkeleton

**Files:**
- Modify: `registry/voraui/altseason-gauge/altseason-gauge.tsx`
- Create: `registry/voraui/altseason-gauge/altseason-gauge-skeleton.tsx`
- Modify: `registry.json`
- Modify: `app/docs/altseason-gauge/page.tsx`
- Test: `tests/altseason-gauge-skeleton.test.ts`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (already used throughout the registry).
- Produces: `AltseasonGaugeSkeleton({ variant?: "meter" | "bars"; className?: string })` from `./altseason-gauge-skeleton`.

- [ ] **Step 1: Write the failing skeleton + wiring test**

Create `tests/altseason-gauge-skeleton.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AltseasonGaugeSkeleton } from "@/registry/voraui/altseason-gauge/altseason-gauge-skeleton";
import { AltseasonGauge } from "@/registry/voraui/altseason-gauge/altseason-gauge";

describe("AltseasonGaugeSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(AltseasonGaugeSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading Altseason Index");
  });

  it("draws a 24-bar ghost row for the bars variant and a track for the meter variant", () => {
    const bars = renderToStaticMarkup(React.createElement(AltseasonGaugeSkeleton, { variant: "bars" }));
    const meter = renderToStaticMarkup(React.createElement(AltseasonGaugeSkeleton, { variant: "meter" }));
    expect((bars.match(/rounded-\[2px\]/g) ?? []).length).toBe(24);
    expect(meter).toContain("rounded-full bg-muted");
  });
});

describe("AltseasonGauge loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(AltseasonGauge, {}));
    expect(html).toContain("voraui-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/altseason-gauge-skeleton.test.ts`
Expected: FAIL - `Cannot find module '@/registry/voraui/altseason-gauge/altseason-gauge-skeleton'`.

- [ ] **Step 3: Create the skeleton component**

Create `registry/voraui/altseason-gauge/altseason-gauge-skeleton.tsx`:

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AltseasonGaugeSkeletonProps {
  /** Matches AltseasonGaugeProps["variant"] so the ghost lines up with the real gauge. */
  variant?: "meter" | "bars";
  className?: string;
}

const BARS_GHOST_COUNT = 24;

export function AltseasonGaugeSkeleton({ variant = "meter", className }: AltseasonGaugeSkeletonProps) {
  return (
    <div
      role="status"
      className={cn("voraui-skeleton-shimmer relative flex flex-col gap-4 overflow-hidden", className)}
    >
      <style href="voraui-altseason-gauge-skeleton" precedence="low">{`
        @keyframes voraui-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: voraui-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="flex items-end gap-3">
        <div className="h-9 w-14 rounded-md bg-muted" />
        <div className="h-3 w-8 rounded bg-muted" />
        <div className="ml-auto h-6 w-24 rounded-full bg-muted" />
      </div>

      {variant === "bars" ? (
        <div className="flex flex-col gap-3">
          <div className="flex h-14 items-stretch gap-[3px]">
            {Array.from({ length: BARS_GHOST_COUNT }, (_, i) => (
              <div
                key={i}
                className={cn("flex-1 rounded-[2px] bg-muted", i % 2 === 0 ? "opacity-60" : "opacity-25")}
              />
            ))}
          </div>
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="h-3 w-full rounded-full bg-muted" />
          <div className="flex justify-between">
            <div className="h-2.5 w-16 rounded bg-muted" />
            <div className="h-2.5 w-12 rounded bg-muted" />
            <div className="h-2.5 w-16 rounded bg-muted" />
          </div>
        </div>
      )}
      <span className="sr-only">Loading Altseason Index</span>
    </div>
  );
}
```

- [ ] **Step 4: Wire the skeleton into `AltseasonGauge` and remove the spinner**

In `registry/voraui/altseason-gauge/altseason-gauge.tsx`, replace the import (line 5):

```ts
import { Loader2 } from "lucide-react";
```

with:

```ts
import { AltseasonGaugeSkeleton } from "./altseason-gauge-skeleton";
```

Replace the `!resolved` block:

```tsx
  if (!resolved) {
    return (
      <div className={cn("flex h-[180px] items-center justify-center", className)}>
        {fetched.error ? (
          <p role="alert" className="text-xs text-muted-foreground">Altseason data is unavailable.</p>
        ) : (
          <div role="status">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading Altseason Index</span>
          </div>
        )}
      </div>
    );
  }
```

with:

```tsx
  if (!resolved) {
    if (fetched.error) {
      return (
        <div className={cn("flex h-[180px] items-center justify-center", className)}>
          <p role="alert" className="text-xs text-muted-foreground">Altseason data is unavailable.</p>
        </div>
      );
    }
    return <AltseasonGaugeSkeleton variant={variant} className={className} />;
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/altseason-gauge-skeleton.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Update `registry.json`**

In `registry.json`, inside the `"altseason-gauge"` item, replace the `"files"` array:

```json
            "files": [
                {
                    "path": "registry/voraui/altseason-gauge/altseason-gauge.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/altseason-gauge.tsx"
                },
                {
                    "path": "registry/voraui/altseason-gauge/use-altseason.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-altseason.ts"
                },
                {
                    "path": "registry/voraui/altseason-gauge/altseason.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/altseason.ts"
                }
            ]
```

with:

```json
            "files": [
                {
                    "path": "registry/voraui/altseason-gauge/altseason-gauge.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/altseason-gauge.tsx"
                },
                {
                    "path": "registry/voraui/altseason-gauge/altseason-gauge-skeleton.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/altseason-gauge-skeleton.tsx"
                },
                {
                    "path": "registry/voraui/altseason-gauge/use-altseason.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-altseason.ts"
                },
                {
                    "path": "registry/voraui/altseason-gauge/altseason.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/altseason.ts"
                }
            ]
```

Also replace, in the same item, `"dependencies": ["framer-motion", "lucide-react", "@number-flow/react"]` with `"dependencies": ["framer-motion", "@number-flow/react"]`.

- [ ] **Step 7: Add a "Skeleton" section to the docs page**

In `app/docs/altseason-gauge/page.tsx`, add the import (below the existing `AltseasonGauge` import on line 6):

```tsx
import { AltseasonGaugeSkeleton } from "@/registry/voraui/altseason-gauge/altseason-gauge-skeleton";
```

Insert a new section directly after the "Variants" `</section>` (after line 36) and before the "Installation" `<section>`:

```tsx
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          AltseasonGauge shows this shaped skeleton automatically while its bundled fetcher loads.
          Import AltseasonGaugeSkeleton directly for a React Suspense fallback or an SSR placeholder.
        </p>
        <ComponentPreview>
          <AltseasonGaugeSkeleton />
        </ComponentPreview>
      </section>
```

- [ ] **Step 8: Run the full test suite and lint**

Run: `npm run test && npm run lint`
Expected: all tests PASS, lint clean.

- [ ] **Step 9: Commit**

```bash
git add registry/voraui/altseason-gauge/altseason-gauge.tsx \
        registry/voraui/altseason-gauge/altseason-gauge-skeleton.tsx \
        registry.json tests/altseason-gauge-skeleton.test.ts \
        app/docs/altseason-gauge/page.tsx
git commit -m "feat: add shaped skeleton loading state to AltseasonGauge"
```

---

### Task 3: BtcRainbowChartSkeleton

**Files:**
- Modify: `registry/voraui/btc-rainbow-chart/btc-rainbow-chart.tsx`
- Create: `registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton.tsx`
- Modify: `registry.json`
- Modify: `app/docs/btc-rainbow-chart/page.tsx`
- Test: `tests/btc-rainbow-chart-skeleton.test.ts`

**Interfaces:**
- Produces: `BtcRainbowChartSkeleton({ className?: string })` from `./btc-rainbow-chart-skeleton`.

- [ ] **Step 1: Write the failing skeleton + wiring test**

Create `tests/btc-rainbow-chart-skeleton.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BtcRainbowChartSkeleton } from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton";
import { BtcRainbowChart } from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart";

describe("BtcRainbowChartSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(BtcRainbowChartSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading BTC price history");
  });

  it("draws four preset ghost pills and a ghost price line", () => {
    const html = renderToStaticMarkup(React.createElement(BtcRainbowChartSkeleton, {}));
    expect((html.match(/h-7 w-10 rounded-md bg-muted/g) ?? []).length).toBe(4);
    expect(html).toContain("<polyline");
  });
});

describe("BtcRainbowChart loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(BtcRainbowChart, {}));
    expect(html).toContain("voraui-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/btc-rainbow-chart-skeleton.test.ts`
Expected: FAIL - `Cannot find module '@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton'`.

- [ ] **Step 3: Create the skeleton component**

Create `registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton.tsx`:

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BtcRainbowChartSkeletonProps {
  className?: string;
}

const PRESET_COUNT = 4;
const STRIPE_COUNT = 6;

export function BtcRainbowChartSkeleton({ className }: BtcRainbowChartSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} role="status">
      <style href="voraui-btc-rainbow-chart-skeleton" precedence="low">{`
        @keyframes voraui-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          animation: voraui-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="flex items-center justify-end gap-1">
        {Array.from({ length: PRESET_COUNT }, (_, i) => (
          <div key={i} className="h-7 w-10 rounded-md bg-muted" />
        ))}
      </div>
      <div className="voraui-skeleton-shimmer relative h-[360px] w-full overflow-hidden rounded-md bg-muted/30 sm:h-[420px]">
        {Array.from({ length: STRIPE_COUNT }, (_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 bg-muted-foreground/10"
            style={{ top: `${(i / STRIPE_COUNT) * 100}%`, height: `${100 / STRIPE_COUNT}%` }}
          />
        ))}
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <polyline
            points="0,170 40,150 80,158 120,120 160,132 200,90 240,100 280,60 320,72 360,40 400,50"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-muted-foreground/30"
          />
        </svg>
      </div>
      <span className="sr-only">Loading BTC price history</span>
    </div>
  );
}
```

- [ ] **Step 4: Wire the skeleton into `BtcRainbowChart` and remove the spinner**

In `registry/voraui/btc-rainbow-chart/btc-rainbow-chart.tsx`, replace the import (line 5):

```ts
import { Loader2 } from "lucide-react";
```

with:

```ts
import { BtcRainbowChartSkeleton } from "./btc-rainbow-chart-skeleton";
```

Replace the loading block:

```tsx
  if (loading) {
    return (
      <div
        role="status"
        className={cn("flex h-[360px] items-center justify-center sm:h-[420px]", className)}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading BTC price history</span>
      </div>
    );
  }
```

with:

```tsx
  if (loading) {
    return <BtcRainbowChartSkeleton className={className} />;
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/btc-rainbow-chart-skeleton.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Update `registry.json`**

In `registry.json`, inside the `"btc-rainbow-chart"` item, replace the `"files"` array:

```json
            "files": [
                {
                    "path": "registry/voraui/btc-rainbow-chart/btc-rainbow-chart.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/btc-rainbow-chart.tsx"
                },
                {
                    "path": "registry/voraui/btc-rainbow-chart/rainbow-bands.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/rainbow-bands.ts"
                },
                {
                    "path": "registry/voraui/btc-rainbow-chart/use-btc-history.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-btc-history.ts"
                },
                {
                    "path": "registry/voraui/btc-rainbow-chart/btc-seed.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/btc-seed.ts"
                }
            ]
```

with:

```json
            "files": [
                {
                    "path": "registry/voraui/btc-rainbow-chart/btc-rainbow-chart.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/btc-rainbow-chart.tsx"
                },
                {
                    "path": "registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/btc-rainbow-chart-skeleton.tsx"
                },
                {
                    "path": "registry/voraui/btc-rainbow-chart/rainbow-bands.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/rainbow-bands.ts"
                },
                {
                    "path": "registry/voraui/btc-rainbow-chart/use-btc-history.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-btc-history.ts"
                },
                {
                    "path": "registry/voraui/btc-rainbow-chart/btc-seed.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/btc-seed.ts"
                }
            ]
```

Also replace, in the same item, `"dependencies": ["lightweight-charts", "next-themes", "lucide-react"]` with `"dependencies": ["lightweight-charts", "next-themes"]`.

- [ ] **Step 7: Add a "Skeleton" section to the docs page**

In `app/docs/btc-rainbow-chart/page.tsx`, add the import (below the existing `BtcRainbowChart`/`BtcRainbowLegend` import block, i.e. after line 9):

```tsx
import { BtcRainbowChartSkeleton } from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton";
```

Insert a new section directly after the main `<ComponentPreview>` block's `</ComponentPreview>` (after line 29) and before the "Installation" `<section>`:

```tsx
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          BtcRainbowChart shows this shaped skeleton automatically while its bundled fetcher loads.
          Import BtcRainbowChartSkeleton directly for a React Suspense fallback or an SSR placeholder.
        </p>
        <ComponentPreview className="block min-h-0">
          <BtcRainbowChartSkeleton />
        </ComponentPreview>
      </section>
```

- [ ] **Step 8: Run the full test suite and lint**

Run: `npm run test && npm run lint`
Expected: all tests PASS, lint clean.

- [ ] **Step 9: Commit**

```bash
git add registry/voraui/btc-rainbow-chart/btc-rainbow-chart.tsx \
        registry/voraui/btc-rainbow-chart/btc-rainbow-chart-skeleton.tsx \
        registry.json tests/btc-rainbow-chart-skeleton.test.ts \
        app/docs/btc-rainbow-chart/page.tsx
git commit -m "feat: add shaped skeleton loading state to BtcRainbowChart"
```

---

### Task 4: TradingChartSkeleton

**Files:**
- Modify: `registry/voraui/trading-chart/trading-chart.tsx`
- Create: `registry/voraui/trading-chart/trading-chart-skeleton.tsx`
- Modify: `registry.json`
- Modify: `app/docs/trading-chart/page.tsx`
- Test: `tests/trading-chart-skeleton.test.ts`

**Interfaces:**
- Produces: `TradingChartSkeleton({ className?: string; height?: number })` and `generateGhostCandles(count: number): { up: boolean; bodyHeightPct: number; wickHeightPct: number }[]` from `./trading-chart-skeleton`.

- [ ] **Step 1: Write the failing pure-function, skeleton, and wiring test**

Create `tests/trading-chart-skeleton.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TradingChartSkeleton, generateGhostCandles } from "@/registry/voraui/trading-chart/trading-chart-skeleton";
import { TradingChart } from "@/registry/voraui/trading-chart/trading-chart";

describe("generateGhostCandles", () => {
  it("returns the requested number of deterministic candles within range", () => {
    const first = generateGhostCandles(48);
    const second = generateGhostCandles(48);
    expect(first).toHaveLength(48);
    expect(first).toEqual(second);
    for (const candle of first) {
      expect(candle.bodyHeightPct).toBeGreaterThan(0);
      expect(candle.bodyHeightPct).toBeLessThanOrEqual(100);
      expect(candle.wickHeightPct).toBeGreaterThanOrEqual(candle.bodyHeightPct);
      expect(candle.wickHeightPct).toBeLessThanOrEqual(100);
    }
  });
});

describe("TradingChartSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(TradingChartSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading market data");
  });

  it("sizes the root to the height prop", () => {
    const html = renderToStaticMarkup(React.createElement(TradingChartSkeleton, { height: 640 }));
    expect(html).toContain("height:640px");
  });
});

describe("TradingChart loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(TradingChart, {}));
    expect(html).toContain("voraui-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/trading-chart-skeleton.test.ts`
Expected: FAIL - `Cannot find module '@/registry/voraui/trading-chart/trading-chart-skeleton'`.

- [ ] **Step 3: Create the skeleton component and its pure candle generator**

Create `registry/voraui/trading-chart/trading-chart-skeleton.tsx`:

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TradingChartSkeletonProps {
  className?: string;
  /** Matches TradingChartProps["height"]. */
  height?: number;
}

export interface GhostCandle {
  up: boolean;
  bodyHeightPct: number;
  wickHeightPct: number;
}

const GHOST_CANDLE_COUNT = 48;

/** Deterministic placeholder candle heights (0-100 percent of the ghost row's
 *  max height) so server and client renders match exactly - Math.random here
 *  would produce a hydration mismatch. */
export function generateGhostCandles(count: number): GhostCandle[] {
  return Array.from({ length: count }, (_, i) => {
    const bodyHeightPct = 25 + 35 * Math.abs(Math.sin(i * 0.7));
    const wickHeightPct = Math.min(bodyHeightPct + 12 + (i % 3) * 4, 100);
    return { up: i % 2 === 0, bodyHeightPct, wickHeightPct };
  });
}

export function TradingChartSkeleton({ className, height = 500 }: TradingChartSkeletonProps) {
  const candles = React.useMemo(() => generateGhostCandles(GHOST_CANDLE_COUNT), []);

  return (
    <div
      role="status"
      className={cn("voraui-skeleton-shimmer relative w-full overflow-hidden rounded-xl bg-card", className)}
      style={{ height }}
    >
      <style href="voraui-trading-chart-skeleton" precedence="low">{`
        @keyframes voraui-skeleton-shimmer {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        .voraui-skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          animation: voraui-skeleton-shimmer 1.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .voraui-skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
      <div className="absolute inset-0 flex items-end gap-[2px] px-3 pb-8 pt-4">
        {candles.map((candle, i) => (
          <div key={i} className="relative flex-1" style={{ height: `${candle.wickHeightPct}%` }}>
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-muted-foreground/20" />
            <div
              className={cn(
                "absolute left-1/2 w-full max-w-[6px] -translate-x-1/2 rounded-[1px]",
                candle.up ? "bg-emerald-500/15" : "bg-rose-500/15",
              )}
              style={{
                height: `${candle.bodyHeightPct}%`,
                top: `${(candle.wickHeightPct - candle.bodyHeightPct) / 2}%`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="absolute right-0 top-0 flex h-full w-12 flex-col justify-between gap-2 bg-background/30 py-4 pr-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-2 w-8 self-end rounded bg-muted-foreground/15" />
        ))}
      </div>
      <span className="sr-only">Loading market data</span>
    </div>
  );
}
```

- [ ] **Step 4: Wire the skeleton into `TradingChart` and remove the spinner**

In `registry/voraui/trading-chart/trading-chart.tsx`, replace the import (line 5):

```ts
import { Loader2 } from "lucide-react";
```

with:

```ts
import { TradingChartSkeleton } from "./trading-chart-skeleton";
```

Replace the loading overlay block:

```tsx
      {/* Loading overlay */}
      {loading && effectiveCandles.length === 0 && (
        <div
          role="status"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm"
        >
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-violet-600" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground" aria-hidden="true">
            Loading market data...
          </p>
          <span className="sr-only">Loading market data</span>
        </div>
      )}
```

with:

```tsx
      {/* Loading skeleton */}
      {loading && effectiveCandles.length === 0 && (
        <TradingChartSkeleton height={height} className="absolute inset-0 z-50" />
      )}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/trading-chart-skeleton.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Update `registry.json`**

In `registry.json`, inside the `"trading-chart"` item, replace the `"files"` array:

```json
            "files": [
                {
                    "path": "registry/voraui/trading-chart/trading-chart.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/trading-chart.tsx"
                },
                {
                    "path": "registry/voraui/trading-chart/use-klines.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-klines.ts"
                },
                {
                    "path": "registry/voraui/trading-chart/markers.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/markers.ts"
                },
                {
                    "path": "registry/voraui/trading-chart/candle-validation.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/candle-validation.ts"
                },
                {
                    "path": "registry/voraui/trading-chart/trading-chart-types.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/trading-chart-types.ts"
                }
            ]
```

with:

```json
            "files": [
                {
                    "path": "registry/voraui/trading-chart/trading-chart.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/trading-chart.tsx"
                },
                {
                    "path": "registry/voraui/trading-chart/trading-chart-skeleton.tsx",
                    "type": "registry:component",
                    "target": "components/voraui/trading-chart-skeleton.tsx"
                },
                {
                    "path": "registry/voraui/trading-chart/use-klines.ts",
                    "type": "registry:hook",
                    "target": "components/voraui/use-klines.ts"
                },
                {
                    "path": "registry/voraui/trading-chart/markers.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/markers.ts"
                },
                {
                    "path": "registry/voraui/trading-chart/candle-validation.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/candle-validation.ts"
                },
                {
                    "path": "registry/voraui/trading-chart/trading-chart-types.ts",
                    "type": "registry:lib",
                    "target": "components/voraui/trading-chart-types.ts"
                }
            ]
```

Also replace, in the same item, `"dependencies": ["lightweight-charts", "next-themes", "lucide-react"]` with `"dependencies": ["lightweight-charts", "next-themes"]`.

- [ ] **Step 7: Add a "Skeleton" section to the docs page**

In `app/docs/trading-chart/page.tsx`, replace the import block (lines 1-5):

```tsx
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import { TradingChartDemo } from "@/components/site/trading-chart-demo";
```

with:

```tsx
import { ComponentPreview } from "@/components/site/component-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import { TradingChartDemo } from "@/components/site/trading-chart-demo";
import { TradingChartSkeleton } from "@/registry/voraui/trading-chart/trading-chart-skeleton";
```

Insert a new section directly after `<TradingChartDemo />` (after line 21) and before the "Installation" `<section>`:

```tsx
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          TradingChart shows this shaped skeleton automatically while its bundled fetcher loads.
          Import TradingChartSkeleton directly for a React Suspense fallback or an SSR placeholder.
        </p>
        <ComponentPreview className="block min-h-0">
          <TradingChartSkeleton height={360} />
        </ComponentPreview>
      </section>
```

- [ ] **Step 8: Run the full test suite and lint**

Run: `npm run test && npm run lint`
Expected: all tests PASS, lint clean.

- [ ] **Step 9: Commit**

```bash
git add registry/voraui/trading-chart/trading-chart.tsx \
        registry/voraui/trading-chart/trading-chart-skeleton.tsx \
        registry.json tests/trading-chart-skeleton.test.ts \
        app/docs/trading-chart/page.tsx
git commit -m "feat: add shaped skeleton loading state to TradingChart"
```

---

### Task 5: Full verification pass

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all test files PASS, including the four new `*-skeleton.test.ts` files and the modified `tests/registry.test.ts`.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors (in particular: no unused `lucide-react`/`Loader2` imports left behind in any of the four component files).

- [ ] **Step 3: Run the full build, which also validates `registry.json` against the actual files on disk**

Run: `npm run build`
Expected: build succeeds - `shadcn build` confirms every `registry.json` file path resolves to a real file, and `next build` typechecks all four modified components, all four new skeleton files, and all four modified docs pages.

- [ ] **Step 4: Visually verify all four loading states in the browser**

Run: `npm run dev` (in the background), then open each of the following routes and confirm the shaped skeleton (not a spinner) appears briefly on first load, with a visible shimmer sweep, before the real data renders with no layout jump:

- `/docs/fear-greed-gauge` (check the `wedges` variant preview specifically, since it has the most distinct ghost geometry)
- `/docs/altseason-gauge`
- `/docs/btc-rainbow-chart`
- `/docs/trading-chart`

Also toggle the OS "reduce motion" setting (or throttle network to "Slow 3G" in DevTools to extend the loading window) and confirm the shimmer sweep stops while the static ghost shapes remain visible.

- [ ] **Step 5: Stop the dev server**

No commit for this task - it is a verification-only gate. If any step fails, fix the issue in the relevant Task's files and re-run this task from Step 1.
