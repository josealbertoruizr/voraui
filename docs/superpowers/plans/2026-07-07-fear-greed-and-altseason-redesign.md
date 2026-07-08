# Fear & Greed Gauge and Altseason Gauge Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Fear & Greed Gauge and Altseason Gauge registry components with a shared segmented-band visual language, animated numbers, and (for Fear & Greed) a `full`/`minimal` variant, without touching either component's data layer.

**Architecture:** Fear & Greed Gauge gets a new pure geometry/data module (`fear-greed-bands.ts`) that both the SVG arc segments and tick/label placement read from, keeping the trigonometry testable and out of JSX. Altseason Gauge's changes are simpler CSS/JSX edits (segmented gradient stops, badge classes, block removal) with no new module needed. Both components add `@number-flow/react` for animated headline numbers.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Vitest, `@number-flow/react` (new dependency).

## Global Constraints

- Node 22 is required (project pins it via `.nvmrc`/`engines`); the shell's default `node` is v20 with no version manager installed. Prefix every `pnpm`/`node` command in this plan with `PATH="/opt/homebrew/opt/node@22/bin:$PATH"`. Never change the global `node` symlink or install a version manager as a side effect.
- Never use an em dash (`—`) in any code comment, commit message, or docs prose written during this plan. Use a plain dash (`-`).
- `@number-flow/react` pins to `^0.6.1` (confirmed current published version) in both `package.json` and `registry.json`.
- No changes to `registry/voraui/fear-greed-gauge/use-fear-greed.ts`, `registry/voraui/altseason-gauge/use-altseason.ts`, or `registry/voraui/altseason-gauge/altseason.ts` - this is a presentational redesign only, per the approved spec `docs/superpowers/specs/2026-07-07-fear-greed-and-altseason-redesign-design.md`.
- No changes to `registry/voraui/btc-rainbow-chart/**` or `registry/voraui/trading-chart/**`.

---

### Task 1: Add the `@number-flow/react` dependency

**Files:**
- Modify: `tests/registry.test.ts`
- Modify: `registry.json`
- Modify: `package.json` (via `pnpm add`, not by hand)

**Interfaces:**
- Produces: `@number-flow/react` installed and importable as `import NumberFlow from "@number-flow/react"` for Tasks 3 and 5.

- [ ] **Step 1: Update the registry test to expect the new dependency**

In `tests/registry.test.ts`, change the `fear-greed-gauge` dependencies assertion:

```ts
    expect(item.dependencies).toEqual(["lucide-react", "@number-flow/react"]);
```

(This replaces the existing `expect(item.dependencies).toEqual(["lucide-react"]);` line.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm test -- registry.test.ts`
Expected: FAIL - `fear-greed-gauge` item's `dependencies` is still `["lucide-react"]`, not matching the new expectation.

- [ ] **Step 3: Update registry.json for both components**

In `registry.json`, add `"@number-flow/react"` to the `dependencies` array of both the `fear-greed-gauge` item (currently `["lucide-react"]`) and the `altseason-gauge` item (currently `["framer-motion", "lucide-react"]`):

```json
      "dependencies": ["lucide-react", "@number-flow/react"],
```

```json
      "dependencies": ["framer-motion", "lucide-react", "@number-flow/react"],
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm test -- registry.test.ts`
Expected: PASS

- [ ] **Step 5: Install the package**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm add @number-flow/react`

This updates `package.json`'s `dependencies` and `pnpm-lock.yaml` automatically.

- [ ] **Step 6: Verify the install**

Run: `grep number-flow package.json`
Expected: a line like `"@number-flow/react": "^0.6.1",` under `dependencies`.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml registry.json tests/registry.test.ts
git commit -m "chore: add @number-flow/react for animated gauge numbers"
```

---

### Task 2: Fear & Greed arc geometry module

**Files:**
- Create: `registry/voraui/fear-greed-gauge/fear-greed-bands.ts`
- Test: `tests/fear-greed-bands.test.ts`

**Interfaces:**
- Produces (consumed by Task 3): `GAUGE_CENTER_X: number`, `GAUGE_CENTER_Y: number`, `FearGreedBand` interface (`{ key: string; label: string; min: number; max: number; color: string }`), `DEFAULT_FEAR_GREED_BANDS: FearGreedBand[]`, `angleForValue(value: number): number`, `arcPoint(radius: number, value: number): { x: number; y: number }`, `describeArc(radius: number, fromValue: number, toValue: number): string`.

- [ ] **Step 1: Write the failing test**

Create `tests/fear-greed-bands.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_FEAR_GREED_BANDS,
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  angleForValue,
  arcPoint,
  describeArc,
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm test -- fear-greed-bands.test.ts`
Expected: FAIL - cannot find module `@/registry/voraui/fear-greed-gauge/fear-greed-bands`.

- [ ] **Step 3: Write the module**

Create `registry/voraui/fear-greed-gauge/fear-greed-bands.ts`:

```ts
export interface FearGreedBand {
  key: string;
  label: string;
  min: number;
  max: number;
  color: string;
}

/** Boundaries mirror alternative.me's own value_classification thresholds,
 *  so the arc's coloring lines up with the label the bundled fetcher returns. */
export const DEFAULT_FEAR_GREED_BANDS: FearGreedBand[] = [
  { key: "extreme-fear", label: "Extreme Fear", min: 0, max: 24, color: "#b91c1c" },
  { key: "fear", label: "Fear", min: 25, max: 44, color: "#ea580c" },
  { key: "neutral", label: "Neutral", min: 45, max: 55, color: "#a16207" },
  { key: "greed", label: "Greed", min: 56, max: 75, color: "#65a30d" },
  { key: "extreme-greed", label: "Extreme Greed", min: 76, max: 100, color: "#15803d" },
];

export const GAUGE_CENTER_X = 130;
export const GAUGE_CENTER_Y = 130;

/** Angle in degrees (standard math convention, 0 deg = +x axis) for a 0-100
 *  gauge value along the top semicircle: 180 deg at value 0 (left) down to
 *  0 deg at value 100 (right). */
export function angleForValue(value: number): number {
  const clamped = Math.min(Math.max(value, 0), 100);
  return 180 - (clamped / 100) * 180;
}

/** Point on the gauge's circle at the given radius for a 0-100 value. */
export function arcPoint(radius: number, value: number): { x: number; y: number } {
  const rad = (angleForValue(value) * Math.PI) / 180;
  return {
    x: GAUGE_CENTER_X + radius * Math.cos(rad),
    y: GAUGE_CENTER_Y - radius * Math.sin(rad),
  };
}

/** SVG arc path `d` for the segment between two values, drawn along the top
 *  semicircle (sweeping left to right). */
export function describeArc(radius: number, fromValue: number, toValue: number): string {
  const start = arcPoint(radius, fromValue);
  const end = arcPoint(radius, toValue);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm test -- fear-greed-bands.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add registry/voraui/fear-greed-gauge/fear-greed-bands.ts tests/fear-greed-bands.test.ts
git commit -m "feat: add fear-greed-bands geometry module for the gauge arc"
```

---

### Task 3: Redesign the Fear & Greed Gauge component

**Files:**
- Modify: `registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx`

**Interfaces:**
- Consumes: `GAUGE_CENTER_X`, `GAUGE_CENTER_Y`, `DEFAULT_FEAR_GREED_BANDS`, `angleForValue`, `arcPoint`, `describeArc` from Task 2's `fear-greed-bands.ts`; `NumberFlow` default export from `@number-flow/react` (Task 1); existing `useFearGreed`/`FearGreedData` from `./use-fear-greed` (unchanged).
- Produces: `FearGreedGaugeProps = { data?: FearGreedData; variant?: "full" | "minimal"; className?: string }`, consumed by Task 4 (docs page) and the existing call sites in `app/page.tsx` and `app/docs/fear-greed-gauge/page.tsx` (both keep working unchanged since `variant` defaults to `"full"`, matching today's only look).

- [ ] **Step 1: Replace the component file**

Replace the full contents of `registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx` with:

```tsx
"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { useFearGreed, type FearGreedData } from "./use-fear-greed";
import {
  DEFAULT_FEAR_GREED_BANDS,
  GAUGE_CENTER_X,
  GAUGE_CENTER_Y,
  angleForValue,
  arcPoint,
  describeArc,
} from "./fear-greed-bands";

export interface FearGreedGaugeProps {
  /** Provide your own data to bypass the bundled alternative.me fetcher. */
  data?: FearGreedData;
  /** "full" shows tick numbers and zone labels; "minimal" shows just the dial, needle, and number. */
  variant?: "full" | "minimal";
  className?: string;
}

const NUMERIC_TICKS = [0, 20, 40, 50, 60, 80, 100];
const MINOR_TICKS = Array.from({ length: 21 }, (_, i) => i * 5).filter(
  (v) => !NUMERIC_TICKS.includes(v),
);
const ZONE_LABELS: Array<{ value: number; text: string }> = [
  { value: 0, text: "EXTREME FEAR" },
  { value: 22, text: "FEAR" },
  { value: 50, text: "NEUTRAL" },
  { value: 78, text: "GREED" },
  { value: 100, text: "EXTREME GREED" },
];

function labelAnchor(value: number): "start" | "middle" | "end" {
  if (value < 45) return "start";
  if (value > 55) return "end";
  return "middle";
}

export function FearGreedGauge({ data, variant = "full", className }: FearGreedGaugeProps) {
  const fetched = useFearGreed({ enabled: data === undefined });
  const resolved = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const value = resolved?.value ?? null;
  const label = resolved?.label ?? "Unknown";
  const hasError = data === undefined && Boolean(fetched.error);
  const needleRotation = value !== null ? 90 - angleForValue(value) : 0;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg viewBox="0 0 260 158" className="w-full max-w-[300px]" aria-hidden="true">
        {DEFAULT_FEAR_GREED_BANDS.map((band) => (
          <path
            key={band.key}
            d={describeArc(90, band.min, band.max)}
            fill="none"
            stroke={band.color}
            strokeWidth={12}
            strokeLinecap="round"
          />
        ))}

        {variant === "full" && (
          <>
            {MINOR_TICKS.map((v) => {
              const inner = arcPoint(98, v);
              const outer = arcPoint(103, v);
              return (
                <line
                  key={`minor-${v}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  strokeWidth={1}
                  className="stroke-muted-foreground/30"
                />
              );
            })}
            {NUMERIC_TICKS.map((v) => {
              const inner = arcPoint(96, v);
              const outer = arcPoint(106, v);
              return (
                <line
                  key={`major-${v}`}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  strokeWidth={1.5}
                  className="stroke-muted-foreground/60"
                />
              );
            })}
            {NUMERIC_TICKS.map((v) => {
              const p = arcPoint(114, v);
              return (
                <text
                  key={`num-${v}`}
                  x={p.x}
                  y={p.y}
                  textAnchor={labelAnchor(v)}
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[9px] font-medium tabular-nums"
                >
                  {v}
                </text>
              );
            })}
            {ZONE_LABELS.map((zone) => {
              const p = arcPoint(126, zone.value);
              return (
                <text
                  key={zone.text}
                  x={p.x}
                  y={p.y}
                  textAnchor={labelAnchor(zone.value)}
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[8px] font-semibold uppercase tracking-wider"
                >
                  {zone.text}
                </text>
              );
            })}
          </>
        )}

        {value !== null && !loading && (
          <g transform={`rotate(${needleRotation} ${GAUGE_CENTER_X} ${GAUGE_CENTER_Y})`}>
            <line
              x1={GAUGE_CENTER_X}
              y1={GAUGE_CENTER_Y}
              x2={GAUGE_CENTER_X}
              y2={GAUGE_CENTER_Y - 72}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="text-foreground"
            />
            <circle cx={GAUGE_CENTER_X} cy={GAUGE_CENTER_Y} r={4} className="fill-foreground" />
          </g>
        )}
      </svg>
      <div className="-mt-10 text-center">
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
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm lint`
Expected: no errors in `fear-greed-gauge.tsx` (pre-existing unrelated warnings elsewhere, if any, are out of scope).

- [ ] **Step 3: Run the full test suite**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm test`
Expected: PASS - no test imports this component directly, so this mainly re-confirms Tasks 1-2 didn't regress.

- [ ] **Step 4: Commit**

```bash
git add registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx
git commit -m "feat: redesign Fear & Greed Gauge with segmented arc and variant prop"
```

---

### Task 4: Update the Fear & Greed docs page and visually verify

**Files:**
- Modify: `app/docs/fear-greed-gauge/page.tsx`

**Interfaces:**
- Consumes: `FearGreedGaugeProps` from Task 3 (specifically the new `variant` prop).

- [ ] **Step 1: Add a Variants section and a Props row**

In `app/docs/fear-greed-gauge/page.tsx`, insert a new section directly after the existing top `<ComponentPreview><FearGreedGauge /></ComponentPreview>` block and before the `Installation` section:

```tsx
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Variants</h2>
        <p className="text-sm text-muted-foreground">
          The default full variant shown above includes tick numbers and zone labels around the
          dial. Pass variant=&quot;minimal&quot; for a smaller footprint with just the dial,
          needle, and number.
        </p>
        <ComponentPreview>
          <FearGreedGauge variant="minimal" />
        </ComponentPreview>
      </section>
```

Then, in the existing `Props` section's `PropsTable` `rows` array, add a new row between `data` and `className`:

```tsx
            {
              name: "variant",
              type: '"full" | "minimal"',
              defaultValue: '"full"',
              description:
                "\"full\" shows tick numbers and zone labels; \"minimal\" shows just the dial, needle, and number.",
            },
```

- [ ] **Step 2: Start the dev server**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm dev` (run in background/a separate terminal - leave it running for this task and Task 5).

- [ ] **Step 3: Visually verify against the reference design**

Open `http://localhost:3000/docs/fear-greed-gauge` in a browser. Confirm, in both light and dark theme (use the theme toggle in the header):

- The full-variant dial (top preview) shows 5 distinct solid-color arc segments (not a blended gradient), minor + major tick marks, numeric labels (0/20/40/50/60/80/100), and the 5 zone-name labels, matching the overall look of the reference screenshots discussed in the design spec.
- No tick number or zone label text is clipped by the SVG's edges at either end of the arc (value 0 / value 100 side). If any label clips, adjust the radius constants (96/98/103/106/114/126 in `fear-greed-gauge.tsx`) or the `viewBox`/`GAUGE_CENTER_X`/`GAUGE_CENTER_Y` values in `fear-greed-bands.ts` until it doesn't, then re-check.
- The needle points to the correct position for the current live value (cross-check the big center number against the needle's position along the arc).
- The center number animates (a brief digit transition) if you reload the page while a previous value was cached, or wait for the 10-minute refresh.
- The minimal-variant preview (new section) shows only the arc, needle, and center number/status word - no tick marks, no numeric labels, no zone labels.
- The homepage (`http://localhost:3000/`) Fear & Greed card still renders correctly (it uses the default `variant="full"`).

Fix any visual issues found directly in `fear-greed-gauge.tsx` / `fear-greed-bands.ts` before proceeding.

- [ ] **Step 4: Commit**

```bash
git add app/docs/fear-greed-gauge/page.tsx
git commit -m "docs: document Fear & Greed Gauge's variant prop and show the minimal variant"
```

(If Step 3 required fixes to `fear-greed-gauge.tsx` or `fear-greed-bands.ts`, stage and include those files too, with a commit message describing the visual fix.)

---

### Task 5: Redesign the Altseason Gauge component and visually verify

**Files:**
- Modify: `registry/voraui/altseason-gauge/altseason-gauge.tsx`

**Interfaces:**
- Consumes: `NumberFlow` default export from `@number-flow/react` (Task 1). No changes to `AltseasonGaugeProps` - `data`, `window`, `className` are unchanged.

- [ ] **Step 1: Replace the component file**

Replace the full contents of `registry/voraui/altseason-gauge/altseason-gauge.tsx` with:

```tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";
import { useAltseason } from "./use-altseason";
import type { AltseasonData, AltseasonWindow } from "./altseason";

export interface AltseasonGaugeProps {
  /** Provide your own data to bypass the bundled CoinPaprika fetcher. */
  data?: AltseasonData;
  /** Comparison window for the bundled fetcher. Ignored when data is set. */
  window?: AltseasonWindow;
  className?: string;
}

export function AltseasonGauge({ data, window: windowProp = "7d", className }: AltseasonGaugeProps) {
  const fetched = useAltseason(windowProp, { enabled: data === undefined });
  const resolved = data ?? fetched.data;

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

  const hasScore = resolved.score !== null;
  const score = resolved.score ?? 50;
  // Clamp marker position with edge padding so a score of 0 / 100 doesn't
  // place the marker half-off the bar and visually collide with the zone
  // labels sitting below.
  const markerLeft = Math.min(Math.max(score, 3), 97);
  const label = resolved.label;
  const isBtc = label === "Bitcoin Season";
  const isAlt = label === "Altcoin Season";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-end gap-3">
        <p className="text-4xl font-bold leading-none tabular-nums text-foreground">
          {hasScore ? <NumberFlow value={Math.round(resolved.score as number)} /> : "—"}
        </p>
        <p className="pb-1 text-xs text-muted-foreground">/ 100</p>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            isBtc && "bg-amber-800/10 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
            isAlt && "bg-violet-700/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
            !isBtc && !isAlt && "bg-muted text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>

      {hasScore ? (
        <div className="relative pt-3">
          <div
            className="h-2.5 w-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, #92400e 0%, #92400e 25%, #71717a 25%, #71717a 75%, #6d28d9 75%, #6d28d9 100%)",
            }}
          />
          <motion.div
            className="pointer-events-none absolute -top-1 bottom-0 -translate-x-1/2"
            initial={{ left: "50%" }}
            animate={{ left: `${markerLeft}%` }}
            transition={{ type: "spring", stiffness: 100 }}
            aria-hidden
          >
            <div className="absolute left-1/2 top-3 h-[18px] w-px -translate-x-1/2 bg-foreground" />
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none text-background shadow-sm">
              {Math.round(resolved.score as number)}
            </div>
          </motion.div>
          <div className="mt-4 flex justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>BTC season</span>
            <span>Mixed</span>
            <span>Altseason</span>
          </div>
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center">
          <p className="text-xs text-muted-foreground">Altseason score is unavailable.</p>
        </div>
      )}
    </div>
  );
}
```

This deletes the former stats grid (`outperforming`/`compared`/`btcChangePct` display block) entirely, switches the bar to hard-stop segmented colors, restyles the season badge to matching matte tones, and animates the headline score with `NumberFlow`.

- [ ] **Step 2: Type-check and lint**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm lint`
Expected: no errors in `altseason-gauge.tsx`. In particular, confirm no "unused variable" warnings for `resolved.outperforming`/`resolved.compared`/`resolved.btcChangePct` (they were only ever accessed inline in the deleted block, so removing the block removes all references cleanly).

- [ ] **Step 3: Run the full test suite**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm test`
Expected: PASS - `tests/altseason.test.ts` and `tests/use-altseason.test.ts` cover `computeAltseason`/`useAltseason` directly and are unaffected by this component-only change.

- [ ] **Step 4: Visually verify against the reference design**

With the dev server still running (from Task 4, Step 2 - restart with `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm dev` if it was stopped), open `http://localhost:3000/docs/altseason-gauge` in a browser. Confirm, in both light and dark theme:

- The score number, season badge, and bar render with no stats grid beneath the bar (the "Outperforming BTC" / "BTC 7d" two-cell block is gone).
- The bar shows 3 distinct solid color blocks (BTC season / Mixed / Altseason) instead of a blended gradient, and the badge's color reads as the same palette family as the bar (not the old bright amber/violet pills).
- The marker still animates smoothly to the correct position and its position stays accurate at the score's actual value.
- The score number animates (a brief digit transition) on data refresh.
- The homepage (`http://localhost:3000/`) Altseason card still renders correctly with the same changes.

Fix any visual issues found directly in `altseason-gauge.tsx` before proceeding.

- [ ] **Step 5: Commit**

```bash
git add registry/voraui/altseason-gauge/altseason-gauge.tsx
git commit -m "feat: redesign Altseason Gauge with segmented bar and drop the stats grid"
```

---

### Task 6: Full verification pass

**Files:** none (verification only, plus any fixes surfaced by this pass).

- [ ] **Step 1: Run the full test suite**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm test`
Expected: PASS, all suites (registry, fear-greed-bands, fear-greed, altseason, use-altseason, and the unrelated trading-chart/rainbow-chart/code-block suites).

- [ ] **Step 2: Run lint**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm lint`
Expected: PASS, 0 errors, 0 warnings.

- [ ] **Step 3: Run the production build**

Run: `PATH="/opt/homebrew/opt/node@22/bin:$PATH" pnpm build`
Expected: build succeeds (this runs `shadcn build && next build`, so it also re-validates `registry.json` produces a valid registry output with the new dependency).

- [ ] **Step 4: Final manual pass on the homepage and both docs pages**

With the dev server running, open `http://localhost:3000/` and both `http://localhost:3000/docs/fear-greed-gauge` and `http://localhost:3000/docs/altseason-gauge` once more, in both light and dark theme. Confirm both components read as one consistent visual family (segmented color bands, matte tones, animated numbers) and that `http://localhost:3000/docs/btc-rainbow-chart` and `http://localhost:3000/docs/trading-chart` are visually unchanged from before this plan.

- [ ] **Step 5: Commit any final fixes**

If Steps 1-4 surfaced any fixes, stage and commit them with a message describing what was fixed. If nothing needed fixing, no commit is needed for this task.
