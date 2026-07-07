# Docs Getting Started Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the docs site's root page into a new Introduction overview and a moved Installation page, and group the sidebar nav into "Getting Started" and "Components" sections.

**Architecture:** Three small, sequential edits to the existing docs site (`app/docs/`): move the current Installation page's content to a new route, replace the old route with new Introduction content, then restructure the shared sidebar layout to render both as labeled groups.

**Tech Stack:** Next.js 16 App Router (Server Components), Tailwind CSS.

## Global Constraints

- No em dashes anywhere in written content (user's explicit instruction for this feature).
- No content changes to the Installation page itself beyond moving it to `/docs/installation`.
- No changes to any of the four component docs pages.
- The site header's "Docs" link intentionally now lands on Introduction instead of Installation - this is the desired behavior change, not a bug to avoid.

---

### Task 1: Move Installation to `/docs/installation`

**Files:**
- Create: `app/docs/installation/page.tsx`

**Interfaces:**
- Produces: the `/docs/installation` route, unchanged in content/behavior from today's `/docs` route. Task 3 links to it from the sidebar.

- [ ] **Step 1: Create the new file with the moved content**

Create `app/docs/installation/page.tsx` with exactly this content (identical to the current `app/docs/page.tsx`, which Task 2 will replace):

```tsx
export const metadata = { title: "Installation" };

const registryConfig = `{
  "registries": {
    "@voraui": "https://voraui.vercel.app/r/{name}.json"
  }
}`;

export default function InstallationPage() {
  return (
    <main className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Installation</h1>
        <p className="mt-2 text-muted-foreground">
          Vora UI is a shadcn registry. Components install as source code into your project.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Add the registry</h2>
        <p className="text-sm text-muted-foreground">
          Add the @voraui namespace to the registries key of your components.json:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
          {registryConfig}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Add components</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
          pnpm dlx shadcn@latest add @voraui/trading-chart
        </pre>
        <p className="text-sm text-muted-foreground">
          Files land in components/voraui/ and npm dependencies are installed automatically.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Zero-config alternative</h2>
        <p className="text-sm text-muted-foreground">
          The full URL form always works without touching components.json:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
          npx shadcn@latest add https://voraui.vercel.app/r/trading-chart.json
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data out of the box</h2>
        <p className="text-sm text-muted-foreground">
          Every component ships with a hook that fetches free, keyless public APIs
          (alternative.me, CoinPaprika, Binance), so it renders real data immediately.
          For production you can pass your own data via props and the bundled fetcher is skipped.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/docs/installation/page.tsx
git commit -m "feat: move Installation docs page to /docs/installation"
```

---

### Task 2: Replace `/docs` with the new Introduction page

**Files:**
- Modify: `app/docs/page.tsx` (full replacement of its current contents)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: the `/docs` route now serving Introduction content. Task 3's sidebar links to it as "Introduction".

- [ ] **Step 1: Replace the file's contents**

Replace the entire contents of `app/docs/page.tsx` with:

```tsx
import Link from "next/link";

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

- [ ] **Step 2: Type-check and lint**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Confirm no em dashes were introduced**

Run: `grep -n "—" app/docs/page.tsx`
Expected: no output (no matches).

- [ ] **Step 4: Commit**

```bash
git add app/docs/page.tsx
git commit -m "feat: add Introduction docs page at /docs"
```

---

### Task 3: Group the sidebar nav into "Getting Started" and "Components"

**Files:**
- Modify: `app/docs/layout.tsx` (full replacement of its current contents)

**Interfaces:**
- Consumes: the `/docs` (Introduction, from Task 2) and `/docs/installation` (from Task 1) routes.
- Produces: nothing further downstream - this is the last task.

- [ ] **Step 1: Replace the file's contents**

Replace the entire contents of `app/docs/layout.tsx` with:

```tsx
import Link from "next/link";

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

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <aside className="hidden w-52 shrink-0 sm:block">
        <nav className="sticky top-20 space-y-4 text-sm">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
```

This preserves every existing link's className exactly (`block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground`) - only the grouping wrapper and the new group-label `<p>` are added.

- [ ] **Step 2: Type-check and lint**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Manually verify the full docs section in the browser**

Run: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH" && pnpm dev` (skip if already running). Then:
- Load `/docs`: confirm it now shows the Introduction page (heading "Introduction", the "What's included" list, "Real data, zero config", and "Next steps" with a working link to `/docs/installation`).
- Load `/docs/installation`: confirm it shows the exact Installation content that used to live at `/docs` (heading "Installation", the registry JSON snippet, the two install commands, "Data out of the box").
- On every docs page, confirm the sidebar shows two labeled groups: "Getting Started" (Introduction, Installation) above "Components" (Trading Chart, BTC Rainbow Chart, Fear & Greed Gauge, Altseason Gauge, in that order), and that clicking each link navigates correctly and highable-hover styling still works.
- Click "Docs" in the site header (from the landing page) and confirm it now lands on the Introduction page.
- Check both light and dark themes.

- [ ] **Step 4: Commit**

```bash
git add app/docs/layout.tsx
git commit -m "feat: group docs sidebar nav into Getting Started and Components"
```

---

## Final verification (after all three tasks)

1. `pnpm test` - confirm all existing unit tests still pass (this feature touches no tested logic).
2. `pnpm lint` and `pnpm exec tsc --noEmit` - both clean.
3. `pnpm build` - production build succeeds (this feature doesn't touch the registry-file-reading pipeline from the previous feature, so no special file-tracing concerns here, but a clean build is still worth confirming).
4. In the browser: `/docs` shows Introduction, `/docs/installation` shows the moved Installation content, the sidebar is grouped correctly on every docs page, and the site header's "Docs" link lands on Introduction - in both light and dark themes.
