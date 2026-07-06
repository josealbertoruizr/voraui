# Landing Page Showcase Design

## Context

The Vora UI landing page (`app/page.tsx`) currently has a hero section with one live Trading Chart demo, followed by a grid of four plain text cards (title + description) linking to each component's docs page.

The user wants the landing page to feel more like a real component library site (referencing Magic UI as a rough visual comparison, not a template to copy): a CTA button under the hero copy, and a proper visual showcase of the components instead of plain text cards.

While investigating a reported "chart is too zoomed in on load" issue, a real bug was found in the shared Trading Chart component that explains it, independent of the landing page.

## Goals

1. Add a "Browse Components" CTA button under the hero install command that scrolls to a new Showcase section on the same page.
2. Replace the current four-card text grid with a "Showcase" section made of live, working previews of each component.
3. Fix the root cause of the Trading Chart's incorrect initial zoom, in the shared registry component (not just the landing page demo).

## Non-goals

- No new routes/pages.
- No header/nav changes (no new "Showcase" nav link).
- No changes to any component's public props/API.

## 1. Hero CTA button

In `app/page.tsx`, add a button below the existing install-command block:

- Label: "Browse Components".
- Style: solid/black pill button (matches the site's existing `Button` component from `components/ui/button`), visually similar in weight to Magic UI's primary CTA but not copied verbatim.
- Behavior: on click, smooth-scrolls to `#showcase` (an anchor on the new Showcase section below). No routing involved, same page.

## 2. Showcase section

Replaces the current `<section className="mt-12 grid gap-4 sm:grid-cols-2">...</section>` block in `app/page.tsx` (the four `Card` links).

Structure:

- `<h2 id="showcase">Showcase</h2>` heading, with a short one-line subtitle (e.g. "Every component, running on real data.").
- A bento-style grid below the heading:
  - **Row 1 (full width):** Trading Chart tile. Renders `HeroDemo` (from `components/site/hero-demo.tsx`), extended to accept an optional `height` prop (default stays 480 for the existing top-of-page usage; the Showcase tile passes a smaller height, e.g. 380).
  - **Row 2:** two columns.
    - Left, wider column: BTC Rainbow Chart tile, rendering `<BtcRainbowChart />` with no props (self-fetches). This component has a built-in height of ~360-420px, so it anchors the row's height.
    - Right, narrower column: two stacked tiles, Fear & Greed Gauge (`<FearGreedGauge />`) and Altseason Gauge (`<AltseasonGauge />`), both self-fetching with no props. Their natural compact height (~200-250px each) means the two stacked roughly match the rainbow tile's height.
- Each tile keeps the current card treatment (bordered, rounded, hover border in violet) and stays a full-tile `Link` to its docs page (`/docs/<component>`), same click behavior as today's cards. Title and short description sit below the live preview inside the tile.

No new data-fetching code is needed: all four components already fetch their own free public-API data with zero required props.

## 3. Trading Chart auto-zoom bug fix

File: `registry/voraui/trading-chart/trading-chart.tsx`.

**Root cause:** `useLatestCandlePolling` starts polling immediately on mount (`poll()` runs in the effect body, not after a delay), racing the historical `useKlines` fetch. If the poll's 1-2-candle response resolves first, `handleNewCandle` writes into `candles` state while `candlesRef.current` and `lastCandlesLengthRef.current` are still `0`. The "Update chart data" effect treats that as the first load (`lastCandlesLengthRef.current === 0` -> `isMajorChange = true`), calls `chart.timeScale().fitContent()` against that 1-2 candle stub, and sets `isAutoFitDoneRef.current = true`. When the real historical batch (up to `limit`, default 500) arrives shortly after, `isAutoFitDoneRef.current` is already `true`, so `fitContent()` is never called again and the chart is left permanently zoomed into whatever the stray live tick contained - matching the screenshots showing only 1-2 candles on load.

**Fix:** track the `loading` value returned by `useKlines` in a ref (`loadingRef`, synced via a `useEffect`), and make `handleNewCandle` a no-op while `loadingRef.current` is `true` and `candlesProp === undefined` (the override-candles path already skips live merges entirely via `hasOverrideCandlesRef`). This guarantees the first data written to the chart series is always the real historical batch regardless of network timing, so `fitContent()` fits the true range on load. No other behavior changes: backward-pagination (`fetchMore`), the override-candles path, and steady-state live updates after the initial load are unaffected.

This fix lives in the shared registry component, so every consumer who installs `@voraui/trading-chart` gets the corrected behavior, not just the landing page demo.

## Testing

- Existing trading-chart unit tests (`registry/voraui/trading-chart` or `tests/`) should continue to pass.
- Add/adjust a test (or reproduce manually) that resolves the live-poll response before the historical fetch resolves, asserting the chart still fits to the full historical range once it arrives.
- Manual verification: load the landing page hero and the Showcase Trading Chart tile, confirm both render zoomed out to the full fetched history on first paint (no flash of a 1-2 candle zoomed-in view).
