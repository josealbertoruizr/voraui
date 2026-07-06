# Mobile Fixes + Hero Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the landing page hero (drop the install command and the now-duplicate hero chart) and fix two real mobile-layout bugs: the BTC Rainbow Chart squishing inside the Showcase grid, and the Props table's huge empty row heights on docs pages.

**Architecture:** Three independent, presentational-only changes in the Next.js App Router site (`app/`, `components/site/`). No registry component APIs change. No new dependencies.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4.

## Global Constraints

- No changes to any registry component's public props/API (from the approved spec's non-goals).
- No new install/CTA copy replacing the removed hero command - the hero simply ends after the button.
- Reuse the existing `w-full` wrapper pattern already established in `components/site/component-preview.tsx` rather than inventing a new one (per the approved spec).

---

### Task 1: Simplify the hero section

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: nothing new. `HeroDemo` (from `components/site/hero-demo.tsx`, already accepts an optional `height` prop) stays imported and is still used inside the Showcase's Trading Chart tile at `height={380}`.
- Produces: nothing new for later tasks - this task only removes markup.

- [ ] **Step 1: Remove the install command block, its caption, and the standalone hero chart section**

In `app/page.tsx`, the current hero section and the section right after it read:

```tsx
        <div className="mx-auto w-fit rounded-lg border border-border bg-muted/40 px-4 py-2 font-mono text-sm">
          pnpm dlx shadcn@latest add @voraui/trading-chart
        </div>
        <p className="text-xs text-muted-foreground">
          Requires the @voraui registry entry in components.json -{" "}
          <Link href="/docs" className="underline hover:text-foreground">
            see Installation
          </Link>
        </p>
        <div className="flex justify-center">
          <Button render={<a href="#showcase" />} nativeButton={false} size="lg" className="rounded-full">
            Browse Components
          </Button>
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-border bg-card p-2 sm:p-4">
        <HeroDemo />
      </section>

      <section id="showcase" className="mt-20 scroll-mt-20">
```

Replace that whole span with:

```tsx
        <div className="flex justify-center">
          <Button render={<a href="#showcase" />} nativeButton={false} size="lg" className="rounded-full">
            Browse Components
          </Button>
        </div>
      </section>

      <section id="showcase" className="mt-20 scroll-mt-20">
```

This removes the install command `<div>`, the "Requires the @voraui registry entry..." caption `<p>` (which used the `Link` import), and the entire standalone `<section>` that rendered the default-height `<HeroDemo />`. The hero section now ends with just the headline, subtitle, and the button.

- [ ] **Step 2: Remove the now-unused `Link` import**

At the top of `app/page.tsx`, remove this line (it's no longer referenced anywhere in the file - `ShowcaseTile` does its own `Link` import internally):

```tsx
import Link from "next/link";
```

The full import block at the top of `app/page.tsx` should now read:

```tsx
import { Button } from "@/components/ui/button";
import { HeroDemo } from "@/components/site/hero-demo";
import { ShowcaseTile } from "@/components/site/showcase-tile";
import { BtcRainbowChart } from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart";
import { FearGreedGauge } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge";
import { AltseasonGauge } from "@/registry/voraui/altseason-gauge/altseason-gauge";
```

- [ ] **Step 3: Type-check and lint**

Run: `pnpm exec tsc --noEmit`
Expected: no output (no errors). This confirms the removed `Link` import isn't referenced anywhere else and there are no other type errors.

Run: `pnpm lint`
Expected: no errors (specifically, no "unused variable" warning for `Link` or `HeroDemo`).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: simplify landing page hero, remove install command and duplicate chart"
```

---

### Task 2: Fix the BTC Rainbow Chart mobile squish in the Showcase grid

**Files:**
- Modify: `components/site/showcase-tile.tsx`

**Interfaces:**
- Consumes: no new interfaces - `ShowcaseTile`'s existing props (`href`, `title`, `description`, `children`, `className`) are unchanged.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Wrap `children` in an explicit-width div**

In `components/site/showcase-tile.tsx`, the current `CardContent` reads:

```tsx
        <CardContent className="flex items-center justify-center overflow-hidden">
          {children}
        </CardContent>
```

Replace it with:

```tsx
        <CardContent className="flex items-center justify-center overflow-hidden">
          <div className="w-full">{children}</div>
        </CardContent>
```

This matches the existing pattern in `components/site/component-preview.tsx` (`<div className="w-full max-w-2xl">{children}</div>` inside a `flex justify-center` wrapper), giving every preview component an explicit-width containing block instead of shrinking to fit its narrowest internal sibling.

- [ ] **Step 2: Type-check and lint**

Run: `pnpm exec tsc --noEmit`
Expected: no output.

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Manually verify the fix in the browser**

Run: `pnpm dev` (skip if already running).

Using the Playwright MCP tools (or any browser), resize the viewport to 390x844, navigate to `http://localhost:3000/#showcase`, and take a full-page screenshot. Confirm the BTC Rainbow Chart tile now fills the full tile width with no dead black space on the right - matching how it renders on `http://localhost:3000/docs/btc-rainbow-chart` at the same viewport width. Repeat in dark mode (click the theme toggle in the header) to confirm no regression there.

- [ ] **Step 4: Commit**

```bash
git add components/site/showcase-tile.tsx
git commit -m "fix: give Showcase tile previews an explicit-width wrapper to stop them shrinking to fit"
```

---

### Task 3: Make the Props table responsive on mobile

**Files:**
- Modify: `components/site/props-table.tsx`

**Interfaces:**
- Consumes: no new interfaces - `PropsTable`'s existing props (`rows: PropRow[]`, where `PropRow` is `{ name: string; type: string; defaultValue?: string; description: string }`) are unchanged.
- Produces: nothing new for later tasks. This is the last task in the plan.

- [ ] **Step 1: Replace the table-only layout with a responsive table + stacked-list layout**

Replace the entire contents of `components/site/props-table.tsx` with:

```tsx
export interface PropRow {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-3 py-2 font-medium">Prop</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Default</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{row.name}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.type}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.defaultValue ?? "-"}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <div key={row.name} className="space-y-1.5 px-3 py-3">
            <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-xs">
              <span>{row.name}</span>
              <span className="text-muted-foreground">{row.type}</span>
              <span className="text-muted-foreground">default: {row.defaultValue ?? "-"}</span>
            </dt>
            <dd className="text-sm text-muted-foreground">{row.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

The `<table>` is now `hidden` by default and restored to `display: table` at the `sm:` breakpoint and up (unchanged desktop appearance). Below `sm:`, a `<dl>` renders each prop as its own block: name, type, and default as wrapping inline labels, then the description as a normal-wrapping paragraph - no shared table row to inflate in height.

- [ ] **Step 2: Type-check and lint**

Run: `pnpm exec tsc --noEmit`
Expected: no output.

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Manually verify the fix in the browser**

With `pnpm dev` running, resize the viewport to 390x844 and navigate to `http://localhost:3000/docs/btc-rainbow-chart` (which showed the bug in the original screenshots). Confirm the Props table now renders as a compact stacked list with no large empty gaps between entries. Then resize to a `sm:`-and-up width (e.g. 800px) and confirm the original table layout still renders unchanged. Spot-check one more docs page, e.g. `http://localhost:3000/docs/trading-chart`, at 390px to confirm the fix applies there too.

- [ ] **Step 4: Commit**

```bash
git add components/site/props-table.tsx
git commit -m "fix: make Props table responsive, stack as a list below sm breakpoint"
```

---

## Final verification (after all three tasks)

1. `pnpm test` - confirm the existing 43 unit tests still pass (none of these changes touch tested logic).
2. `pnpm lint` and `pnpm exec tsc --noEmit` - confirm both are clean.
3. In the browser at 390x844: load `/`, confirm the hero shows only headline/subtitle/button (no command, no standalone chart), scroll via the "Browse Components" button and confirm it still lands on `#showcase`, and confirm the full Showcase grid (Trading Chart, BTC Rainbow Chart, Fear & Greed Gauge, Altseason Gauge) renders with no dead space or squished tiles, in both light and dark themes.
4. At a desktop width (e.g. 1280px): confirm the hero, Showcase grid, and at least one docs page's Props table all still look correct (no regressions from the mobile-specific CSS changes, since all of it is gated behind `sm:` breakpoints or is a pure wrapper-div addition that doesn't change desktop layout).
