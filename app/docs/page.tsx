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
