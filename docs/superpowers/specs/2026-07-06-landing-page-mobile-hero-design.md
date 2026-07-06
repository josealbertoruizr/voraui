# Landing Page Mobile Fixes + Hero Simplification

## Context

After shipping the Showcase section (see `docs/superpowers/specs/2026-07-06-landing-page-showcase-design.md`), the user reviewed the result on mobile and flagged three problems, backed by screenshots:

1. The BTC Rainbow Chart tile inside the Showcase grid renders squished into roughly the left half of its tile on mobile, with a large dead black area on the right.
2. The Props table on component docs pages (e.g. `/docs/btc-rainbow-chart`) renders with huge empty vertical gaps between rows on mobile.
3. The hero section (headline, install command, standalone Trading Chart demo) now visually duplicates the Showcase section's own Trading Chart tile immediately below it, and the user wants the install command removed for now regardless.

## Goals

1. Simplify the hero: remove the install command box and its caption line, and remove the standalone hero `HeroDemo` chart section entirely. The hero keeps just the headline, subtitle, and the "Browse Components" button (still scrolling to `#showcase`). The Showcase section's own Trading Chart tile becomes the first live chart a visitor sees.
2. Fix the BTC Rainbow Chart's mobile squish inside the Showcase grid.
3. Fix the Props table's mobile layout on all docs pages.

## Non-goals

- No changes to any registry component's public props/API.
- No changes to the Showcase grid's layout/composition beyond removing the now-redundant hero chart above it.
- No new install/CTA copy to replace the removed command - the hero simply ends after the button, per the user's "for now" framing.

## 1. Hero simplification

**File:** `app/page.tsx`

Remove:
- The install command block (`<div className="mx-auto w-fit ... font-mono text-sm">pnpm dlx shadcn@latest add @voraui/trading-chart</div>`).
- Its caption paragraph (`Requires the @voraui registry entry in components.json - see Installation`), since it only makes sense as context for the command being removed.
- The standalone `<section className="mt-12 rounded-xl border border-border bg-card p-2 sm:p-4"><HeroDemo /></section>` block entirely (the default-height, non-Showcase instance).

Keep: the `<h1>`, the subtitle `<p>`, and the "Browse Components" button (still `render={<a href="#showcase" />}`).

The `HeroDemo` import in `app/page.tsx` stays, since the Showcase section still renders `<HeroDemo height={380} />` inside its Trading Chart tile - only the top-level, default-height call is removed. `components/site/hero-demo.tsx` itself needs no changes.

Removing the duplicate top-level `HeroDemo` also means the landing page mounts one live Binance-polling `TradingChart` instance instead of two.

## 2. BTC Rainbow Chart mobile squish - root cause and fix

**Reproduced:** at a 390px viewport, `BtcRainbowChart` renders full-width and correctly on its own docs page (`/docs/btc-rainbow-chart`). Inside the landing page's Showcase grid, the same component renders squished into roughly its narrowest sibling's width (the preset-button row, ~230px), with the remaining tile width left blank.

**Root cause:** `ShowcaseTile`'s `CardContent` (`components/site/showcase-tile.tsx`) is `flex items-center justify-center`. `BtcRainbowChart`'s own root wrapper div (`<div className={cn("space-y-2", className)}>`) declares no width of its own - only a deeper child div carries `w-full`. In a `flex justify-center` row, a child with no declared width shrinks to fit its own content, and a percentage-width grandchild doesn't contribute to that content-size calculation - so the wrapper collapses to the width of its narrowest sibling (the preset-button row) instead of stretching to fill the tile. `TradingChart`'s root div already declares `w-full` directly on itself, which is why the Trading Chart tile doesn't show this bug.

**Fix:** in `ShowcaseTile`, wrap `{children}` inside `CardContent` with an inner `<div className="w-full">`, giving every preview an explicit-width containing block regardless of its own internal layout. This exactly matches the pattern already used in `components/site/component-preview.tsx` for docs-page previews (`<div className="w-full max-w-2xl">{children}</div>` inside a `flex justify-center` wrapper) - reusing an established, proven pattern rather than inventing a new one. This is a `ShowcaseTile`-only change; no registry component is touched.

## 3. Props table mobile layout - root cause and fix

**Reproduced:** at a 390px viewport on `/docs/btc-rainbow-chart`, the Props table overflows horizontally (via its existing `overflow-x-auto` wrapper) because its columns don't adapt to narrow widths. The Description column - scrolled out of the visible area - word-wraps into many lines at its forced-narrow width. Since table rows size to their tallest cell, every row's height inflates to match that wrapped Description cell, leaving the visible Prop/Type/Default text floating at the top of a very tall, mostly-empty-looking row.

**Fix:** in `components/site/props-table.tsx`, keep the existing `<table>` for `sm:` and up (wrap it in `hidden sm:block`), and add a `sm:hidden` stacked list for narrower viewports: one block per row containing the prop name, its type/default as small inline labels, and the description as a normally-wrapping paragraph - no shared table row to inflate. This fixes every docs page that uses `PropsTable` (trading-chart, btc-rainbow-chart, fear-greed-gauge, altseason-gauge), not just the one shown in the screenshot.

## Testing

- No unit tests are added: all three changes are presentational/layout (JSX/Tailwind) with no pure logic to unit test, consistent with how the previous Showcase work was verified.
- Manual verification (mobile viewport, e.g. 390x844, in both light and dark themes):
  - Confirm the hero shows only headline, subtitle, and button - no install command, no standalone chart.
  - Confirm the Showcase section's BTC Rainbow Chart tile fills the full tile width with no dead space, matching how it renders on its own docs page.
  - Confirm the Props table on at least two docs pages (e.g. `/docs/btc-rainbow-chart` and `/docs/trading-chart`) shows a compact, no-dead-space stacked layout on mobile, and is unchanged (table) at `sm:` and up.
  - Confirm the "Browse Components" button still smooth-scrolls to `#showcase`.
- Re-run `pnpm test`, `pnpm lint`, and `tsc --noEmit` to confirm no regressions.
