# Fear & Greed Gauge and Altseason Gauge Redesign

## Context

Vora UI ships four registry components: Trading Chart, BTC Rainbow Chart, Fear & Greed Gauge, and Altseason Gauge.
The user wants a pure visual/design pass on Fear & Greed Gauge and Altseason Gauge (no data-layer or hook changes), leaving BTC Rainbow Chart and Trading Chart untouched.
The goal is to move both components from their current plain/ad-hoc look toward the library's stated design philosophy: simple, clean, "fancy with a few touches," data-focused, with a shared visual language across components.

Reference images the user provided show a semicircle Fear & Greed dial with:
- Discrete colored arc segments per zone (not a smooth gradient)
- Minor tick marks and numeric labels (0/20/40/50/60/80/100) around the arc
- Radiating zone-name labels (EXTREME FEAR / FEAR / NEUTRAL / GREED / EXTREME GREED)
- A thin needle ("baton hand") and pivot circle
- A large center number with a status word beneath it

See [[voraui-design-philosophy]]: components should visualize one data analytic each, not bundle in secondary derived stats. This directly drives the Altseason stat-grid removal below.

## Goals

1. Redesign `FearGreedGauge` (`registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx`) with a segmented-arc look and a `variant` prop.
2. Redesign `AltseasonGauge` (`registry/voraui/altseason-gauge/altseason-gauge.tsx`) with a segmented bar, restyled badge, and the stat grid removed.
3. Add animated digit transitions (`@number-flow/react`) to both components' headline numbers.
4. Update `registry.json` to reflect the new `@number-flow/react` dependency for both entries.

## Non-goals

- No changes to `use-fear-greed.ts` or `use-altseason.ts` (data fetching, parsing, or returned types stay exactly as they are).
- No changes to `altseason.ts` (score/label computation logic).
- No changes to BTC Rainbow Chart or Trading Chart.
- No changes to the two components' docs pages content beyond what's needed to demo the new `variant` prop, if the docs pages choose to show it (left to implementation discretion, not a design requirement here).

## 1. Fear & Greed Gauge

### Props

```ts
export interface FearGreedGaugeProps {
  data?: FearGreedData;
  /** Visual density. "full" shows tick numbers and zone labels; "minimal" shows just the dial, needle, and number. Defaults to "full". */
  variant?: "full" | "minimal";
  className?: string;
}
```

`data` and `className` behavior is unchanged. This is additive, not a breaking change.

### Arc

Five discrete solid-color segments computed from fixed band boundaries (0-24 Extreme Fear, 25-44 Fear, 45-55 Neutral, 56-75 Greed, 76-100 Extreme Greed - the same boundaries `alternative.me` itself uses for `value_classification`), each rendered as its own `<path>` arc rather than today's single gradient-stroked path. Exact matte hex per band is an implementation-time detail, tuned by eye against the reference images (roughly: deep red, red-orange, muted amber/gray, yellow-green, deep green) - no further sign-off needed on precise hex values.

### Full variant only

- Minor tick marks every 5 units around the arc
- Numeric labels at 0, 20, 40, 50, 60, 80, 100
- Zone-name labels (EXTREME FEAR, FEAR, NEUTRAL, GREED, EXTREME GREED) radiating outward at each band's angle

### Both variants

- Needle: matte, theme-adaptive (`currentColor`-based, same approach as today's `text-foreground` needle, just restyled to read as a sharper "baton" - thinner shaft, cleaner tip) with a pivot circle at the base
- Center: `@number-flow/react`'s `<NumberFlow value={...} />` in place of today's static `<p>{value}</p>`, animating between refreshes; status word (e.g. "FEAR") stays as static text beneath it
- Loading and error states keep today's behavior (spinner, `role="status"`/`role="alert"`), just restyled to match the new visual language

## 2. Altseason Gauge

### Props

Unchanged: `data`, `window`, `className`. No new prop needed here (no variant requested for this component).

### Removed

The entire stats block is deleted:

```tsx
<div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-3">
  {/* Outperforming BTC ... */}
  {/* BTC {window} ... */}
</div>
```

Per [[voraui-design-philosophy]], `resolved.outperforming`/`resolved.compared`/`resolved.btcChangePct` are no longer read by the component at all. `use-altseason.ts` and `altseason.ts` keep computing and returning these fields unchanged (non-goal above) - they're simply unused by this component now, available to consumers who read `data` themselves.

### Bar

Switches from the current 3-stop CSS gradient background to discrete colored segments matching the three season zones (BTC season / Mixed / Altseason), using the same matte palette family introduced in the Fear & Greed dial (e.g. matte amber for BTC season, matte neutral gray for Mixed, matte violet for Altseason) rather than today's brighter `#f59e0b`/`#8b5cf6`. The animated marker (framer-motion spring, `motion.div` positioned by `markerLeft`) is unchanged in behavior, just sits over the new segmented bar.

### Badge

The "Bitcoin Season"/"Altcoin Season"/neutral pill restyles from today's bright `bg-amber-500/15`/`bg-violet-500/15` treatment to the same matte tones as the segmented bar, so the badge and bar read as one consistent palette instead of two different color systems.

### Score number

`@number-flow/react`'s `<NumberFlow value={...} />` replaces today's static `Math.round(resolved.score)` text, matching the Fear & Greed treatment.

## 3. Shared dependency

Add `@number-flow/react` (^0.6.1) to `package.json` and to both `registry.json` entries' `dependencies` arrays (`fear-greed-gauge` and `altseason-gauge`). No other new dependencies - segmented arcs/bars remain plain SVG/CSS, consistent with how these components avoid charting libraries today.

## Testing

- No existing unit tests cover these two components' rendering (confirm during implementation; if any exist for band/color logic, update them for the new segment boundaries).
- Manual verification for each component, in both light and dark theme, in both the docs page and hero/showcase demo usages:
  - Fear & Greed: `full` and `minimal` variants render correctly, arc segments align with needle rotation, `NumberFlow` animates on data refresh, loading/error states still work.
  - Altseason: bar segments and marker position stay accurate across the full score range (including edge scores 0/100, matching the existing marker-clamping comment in the code), stat grid is gone, badge and bar read as one palette, `NumberFlow` animates on refresh.
