import Link from "next/link";

export const metadata = { title: "Introduction" };

export default function IntroductionPage() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Introduction</h1>
        <p className="mt-2 text-muted-foreground">
          Create your own crypto and trading dashboards with just a simple copy and paste.
          Vora UI is a set of open source crypto market analytics components for shadcn/ui.
          Components install as source code into your project, so you own every line and can
          change anything.
        </p>
      </div>

        <section className="space-y-3">
        <h2 className="text-xl font-semibold">Philosophy</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            When I first entered the crypto world, I realized how exhausting it was to track different analytics. I had to check
            the Bitcoin Rainbow Chart on one website, the Fear and Greed Index on another, and basic price action somewhere else.
            When I decided to build my own unified dashboard, I noticed a huge gap: there wasn&apos;t a comprehensive UI library tailored
            for these types of financial components, and many existing trading chart solutions came with a heavy price tag.
          </p>
          <p>
            That&apos;s why I created voraui. Inspired by amazing libraries like shadcn, magicui, aceternityui, and kokonutui, this library
            solves the real headache. While the underlying financial data is often free, designing and building the actual dashboard
            components from scratch is a pain.
          </p>
          <p>
            My goal with voraui is to make dashboard creation effortless and accessible for everyone.
            I hope you enjoy the designs! :)
          </p>
        </div>
      </section>

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

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Credits</h2>
        <p className="text-sm text-muted-foreground">
          Vora UI is heavily inspired by{" "}
          <Link href="https://ui.shadcn.com" className="underline hover:text-foreground">
            shadcn/ui
          </Link>{" "}
          and distributed the same way: source code you copy into your project via the shadcn
          CLI, not an npm package you depend on.
        </p>

        <h3 className="text-sm font-medium text-foreground">App &amp; docs site</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <Link href="https://nextjs.org" className="font-medium text-foreground underline hover:no-underline">
              Next.js
            </Link>
            , <Link href="https://react.dev" className="font-medium text-foreground underline hover:no-underline">React</Link>
            , and{" "}
            <Link href="https://www.typescriptlang.org" className="font-medium text-foreground underline hover:no-underline">
              TypeScript
            </Link>{" "}
            for the app and docs site.
          </li>
          <li>
            <Link href="https://tailwindcss.com" className="font-medium text-foreground underline hover:no-underline">
              Tailwind CSS
            </Link>{" "}
            for styling, with{" "}
            <Link href="https://base-ui.com" className="font-medium text-foreground underline hover:no-underline">
              Base UI
            </Link>{" "}
            for accessible, unstyled component primitives.
          </li>
          <li>
            <Link href="https://lucide.dev" className="font-medium text-foreground underline hover:no-underline">
              Lucide
            </Link>{" "}
            for UI icons and{" "}
            <Link href="https://simpleicons.org" className="font-medium text-foreground underline hover:no-underline">
              Simple Icons
            </Link>{" "}
            for brand marks.
          </li>
          <li>
            <Link href="https://shiki.style" className="font-medium text-foreground underline hover:no-underline">
              Shiki
            </Link>{" "}
            renders the syntax-highlighted code blocks throughout these docs.
          </li>
        </ul>

        <h3 className="text-sm font-medium text-foreground">Inside the components</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <Link
              href="https://www.tradingview.com/lightweight-charts/"
              className="font-medium text-foreground underline hover:no-underline"
            >
              Lightweight Charts
            </Link>{" "}
            from TradingView is the charting engine behind{" "}
            <span className="text-foreground">Trading Chart</span> and{" "}
            <span className="text-foreground">BTC Rainbow Chart</span>.
          </li>
          <li>
            <Link href="https://github.com/pacocoursey/next-themes" className="font-medium text-foreground underline hover:no-underline">
              next-themes
            </Link>{" "}
            drives dark mode site-wide, and keeps <span className="text-foreground">Trading Chart</span> and{" "}
            <span className="text-foreground">BTC Rainbow Chart</span> in sync with it since their
            canvases are painted outside the DOM.
          </li>
          <li>
            <Link href="https://motion.dev" className="font-medium text-foreground underline hover:no-underline">
              Motion
            </Link>{" "}
            animates the needle and thumb in{" "}
            <span className="text-foreground">Fear &amp; Greed Gauge</span> and{" "}
            <span className="text-foreground">Altseason Gauge</span>, and{" "}
            <Link href="https://number-flow.barvian.me" className="font-medium text-foreground underline hover:no-underline">
              Number Flow
            </Link>{" "}
            animates their score readouts.
          </li>
        </ul>
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
