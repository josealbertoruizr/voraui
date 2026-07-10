# Hero: full-viewport section + flickering grid background

## Problem

The landing page hero (title, subtitle, CTA, tech-stack icons) currently sits at the top of a normal-flow page, with the Showcase section immediately visible below it on most screens.
The user wants the hero to read as the primary "first impression" of the page: it should fill the first viewport on load, with its content vertically centered, and the Showcase section pushed below the fold.
The user also wants a subtle animated background texture behind the hero, in the style of Magic UI's background components, to add visual depth without competing with the black/white minimal aesthetic.

## Goals

- Hero section fills the viewport (minus the sticky header) on load; Showcase is not visible without scrolling on typical screen sizes.
- Hero content (title, subtitle, CTA button, tech-stack icons) is vertically centered as a group within that space, more so than the current top-anchored layout.
- An animated "flickering grid" texture sits behind the hero content, subtle, theme-aware (light/dark), and fades toward the edges so it doesn't visually compete with the text.
- No new runtime dependency; component is small and owned by this repo.

## Non-goals

- No changes to the Showcase section's content or internal layout.
- No changes to the site header.
- Not vendoring Magic UI's actual source; we write our own minimal version tailored to this use case.

## Design

### Layout (`app/page.tsx`)

The hero markup moves into its own section:

```tsx
<section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden">
  <FlickeringGrid className="absolute inset-0 -z-10" />
  <div className="space-y-4 text-center">
    {/* existing h1 / p / Button / TechStack, unchanged */}
  </div>
</section>
```

- `min-h-[calc(100vh-3.5rem)]` accounts for the sticky header's fixed height (`h-14` = 3.5rem in `site-header.tsx`), so the hero fills exactly the remaining viewport rather than overshooting and forcing an extra scroll.
- `min-h` (not `h-screen`) so content is never clipped on very short viewports - it just grows.
- `overflow-hidden` clips the grid canvas to the section bounds.
- The existing `Showcase` section (`id="showcase"`, `mt-20 scroll-mt-20`) is unchanged and simply follows in normal flow.

### New component: `components/site/flickering-grid.tsx`

A canvas-based decorative background, client component (`"use client"`):

- Props: `className?: string` only. No configuration surface beyond that - it's a single-purpose decorative element, not a reusable registry component, so it doesn't need a props API.
- Sizes itself to its parent via `ResizeObserver`, redrawing the canvas backing store at `devicePixelRatio` for sharpness.
- Draws a grid of small squares (~4px squares, ~4px gaps, i.e. an 8px cell pitch) across the canvas. Each square has its own opacity value in [0, ~0.35] that receives small random deltas each animation frame, clamped to that range, producing an independent "flicker" per square rather than a global pulse.
- Square fill color is read from the computed `color` of the element (`currentColor`), so wrapping the component in a `text-foreground` (or similar) class makes it automatically adapt between light and dark themes with no theme-detection logic in the component itself.
- A radial fade is applied by multiplying each square's drawn alpha by a radial falloff computed from its distance to the canvas center (1 near the center, tapering to 0 near the edges/corners) - implemented as a plain math multiplier in the draw loop, not a CSS mask, so it composites correctly with the per-square flicker.
- Animation loop uses `requestAnimationFrame`, and is skipped in favor of a single static draw when `window.matchMedia("(prefers-reduced-motion: reduce)").matches` is true.
- Cleans up the RAF loop and `ResizeObserver` on unmount.
- `pointer-events-none` on the canvas so it never intercepts clicks on hero content above it.

### Placement

`<FlickeringGrid>` is rendered as an absolutely-positioned first child of the hero `<section>` (`absolute inset-0 -z-10`), so it sits behind the centered content column and spans the full hero section - not just a strip below the icons.

## Testing / verification

- Run the dev server, view the hero in both light and dark theme: confirm the grid is visible-but-subtle in each, and doesn't reduce text contrast/legibility of the title or subtitle.
- Confirm the hero fills the viewport under the sticky header with no unexpected scrollbar/jitter, and that the Showcase heading is not visible without scrolling on a standard laptop viewport (~1440x900 and ~1280x800).
- Emulate `prefers-reduced-motion: reduce` in devtools and confirm the grid renders as a static frame (no flicker).
- Confirm the existing `#showcase` anchor link (Browse Components button) still scrolls to the right place given `scroll-mt-20`.
- Resize the browser window and confirm the canvas redraws crisply at the new size (no blurriness, no stale/cut-off grid).
