# Component Skeleton Loading States - Design

Date: 2026-07-08

## Goal

Replace the `Loader2` spinner loading treatment in all four Vora UI registry components with shaped-ghost skeletons.
Each skeleton mirrors its component's actual silhouette so the loading state feels premium and produces zero layout shift when data arrives.

## Scope

Applies to all four registry items:

- `fear-greed-gauge`
- `altseason-gauge`
- `btc-rainbow-chart`
- `trading-chart`

## Decisions

- **Fidelity:** shaped ghosts.
  Each skeleton echoes the real component's geometry (gauge arcs, chart frames, candlesticks), not generic gray blocks.
- **Animation:** shimmer sweep.
  A soft translucent highlight sweeps across the skeleton shapes on a ~1.8s loop.
- **API shape:** exported and internal.
  Each item ships a standalone skeleton component (e.g. `FearGreedGaugeSkeleton`) in its own file.
  The main component renders it automatically while its bundled fetcher loads, and users can import it directly for React Suspense fallbacks or SSR placeholders.
- **Architecture:** per-component skeleton file inside each registry item.
  No shared skeleton primitive and no new registry dependency.
  The small shimmer pattern is duplicated in each file so every `npx shadcn add` stays fully self-contained, consistent with the existing registry structure.

## Shared pattern (duplicated per item)

Each skeleton file contains a small internal shimmer treatment:

- Shapes drawn in `bg-muted` / `fill-muted` tones.
- A translucent highlight gradient sweeps left-to-right on a ~1.8s loop via a namespaced `@keyframes` (e.g. `vora-shimmer`) emitted in an inline `<style>` tag.
- Respects `prefers-reduced-motion`: falls back to static shapes with no sweep.
- Root carries `role="status"` with an `sr-only` "Loading ..." label, matching the accessibility contract of the current spinners.

## Per-component skeleton shapes

### FearGreedGaugeSkeleton

- Variant-aware: `gradient` | `wedges`.
- Uses the same SVG arc geometry as the real gauge, reusing its exported constants where possible.
- Muted arc segments, a ghost circle where the value number sits, and a rounded bar where the label goes.
- Identical viewBox and layout to the real component so there is zero layout shift when data lands.

### AltseasonGaugeSkeleton

- Variant-aware: `meter` | `bars` (matches `AltseasonGaugeProps["variant"]`).
- Muted spectrum-style track for `meter` (or a bar row for `bars`), rounded bars for the score number and caption.

### BtcRainbowChartSkeleton

- Chart frame at the same `h-[360px] sm:h-[420px]` footprint.
- Muted horizontal rainbow-band stripes (ghosted, monochrome) with a faint ghost price line path.
- Preset-button-shaped pills where the range buttons sit.

### TradingChartSkeleton

- Chart-sized frame with a row of ghost candlesticks: alternating heights, muted rects with wicks.
- Ghost axis strips on the right and bottom edges.
- Replaces the current backdrop-blur spinner overlay for the initial load only.
  Pagination ("load more history") behavior is unchanged.

## Wiring

- In each main component, the `loading` branch swaps from `Loader2` to rendering its skeleton with the same layout-affecting props (variant, className, size props).
- `Loader2` imports are removed where no longer used.
- Each skeleton file is added to its item's file list in `registry.json`.
- Docs pages get a short "Skeleton" section with a Suspense-fallback usage example.
- The demo site's component pages show the skeleton naturally on first load.

## Testing

- Unit tests per skeleton: renders with `role="status"`, variant prop switches geometry.
- Unit tests per main component: renders the skeleton (not a spinner) when its hook reports loading.
- Visual end-to-end check on the dev site by observing first load / throttled network in the browser.
