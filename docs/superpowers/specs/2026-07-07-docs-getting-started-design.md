# Docs Getting Started Section

## Context

The docs sidebar (`app/docs/layout.tsx`) is currently a flat list of five links, with `/docs` itself serving as the Installation page. The user wants a grouped sidebar matching shadcn/ui's own docs structure: a "Getting Started" group (Introduction, Installation) followed by a "Components" group (the four existing component pages), with a separate Introduction overview page.

## Goals

1. Add a new Introduction page at `/docs` (the docs root), replacing the current Installation content there.
2. Move the existing Installation content, unchanged, to a new `/docs/installation` route.
3. Restructure the sidebar nav into two labeled groups: "Getting Started" (Introduction, Installation) and "Components" (Trading Chart, BTC Rainbow Chart, Fear & Greed Gauge, Altseason Gauge - reordered to lead with the flagship Trading Chart, matching the README's own order).

## Non-goals

- No content changes to the Installation page itself beyond moving it to a new route.
- No changes to any of the four component docs pages.
- No changes to the site header's "Docs" link (`/docs`) - it now lands on Introduction instead of Installation, which is the intended behavior change.

## 1. Routes

**New file:** `app/docs/page.tsx` becomes the Introduction page (replacing its current Installation content).

**New file:** `app/docs/installation/page.tsx` gets the Installation page's current content, moved verbatim (same JSX, same `registryConfig` string, same four sections: "Add the registry", "Add components", "Zero-config alternative", "Data out of the box").

## 2. Introduction page content

```tsx
export const metadata = { title: "Introduction" };

export default function IntroductionPage() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Introduction</h1>
        <p className="mt-2 text-muted-foreground">
          Vora UI is a set of open source crypto market analytics components for shadcn/ui.
          Components install as source code into your project, so you own every line and can
          change anything.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What&apos;s included</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Trading Chart</span> (flagship):
            candlesticks with trade markers, same-candle clustering, hover tooltips, infinite
            scroll history, and live Binance updates.
          </li>
          <li>
            <span className="font-medium text-foreground">BTC Rainbow Chart</span>: the classic
            log-regression rainbow with full daily history back to 2010.
          </li>
          <li>
            <span className="font-medium text-foreground">Fear &amp; Greed Gauge</span>: the
            crypto Fear &amp; Greed index as a live SVG dial.
          </li>
          <li>
            <span className="font-medium text-foreground">Altseason Gauge</span>: the Altcoin
            Season index computed client-side from CoinPaprika data.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Real data, zero config</h2>
        <p className="text-sm text-muted-foreground">
          Every component fetches from free, keyless public APIs out of the box, so it renders
          real data the moment you drop it in. For production, pass your own data through props
          and the bundled fetcher is skipped entirely.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Next steps</h2>
        <p className="text-sm text-muted-foreground">
          See the{" "}
          <Link href="/docs/installation" className="underline hover:text-foreground">
            Installation guide
          </Link>{" "}
          to add the registry and your first component, or browse each component&apos;s docs page
          for props and data source notes.
        </p>
      </section>
    </main>
  );
}
```

(Needs `import Link from "next/link";` at the top.)

No em dashes appear anywhere in this content, per the user's explicit instruction.

## 3. Sidebar nav grouping

**File:** `app/docs/layout.tsx`.

Replace the flat `nav` array with a grouped structure:

```tsx
const navGroups = [
  {
    label: "Getting Started",
    items: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/installation", label: "Installation" },
    ],
  },
  {
    label: "Components",
    items: [
      { href: "/docs/trading-chart", label: "Trading Chart" },
      { href: "/docs/btc-rainbow-chart", label: "BTC Rainbow Chart" },
      { href: "/docs/fear-greed-gauge", label: "Fear & Greed Gauge" },
      { href: "/docs/altseason-gauge", label: "Altseason Gauge" },
    ],
  },
];
```

The nav renders each group with a small muted uppercase label above its links (`text-xs font-semibold uppercase tracking-wide text-muted-foreground`), reusing the existing link styling (`block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground`) for each item, unchanged from today.

## Testing

- No unit-testable logic (presentational/content only), consistent with how prior docs-page work in this project was verified.
- Manual verification: load `/docs` (confirm Introduction content, no em dashes, both links in "Next steps" work), load `/docs/installation` (confirm identical content to what `/docs` used to show), confirm the sidebar shows both groups with correct labels and links on every docs page, confirm the site header's "Docs" link lands on the new Introduction page, and check both light and dark themes.
