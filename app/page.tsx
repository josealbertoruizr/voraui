import { Button } from "@/components/ui/button";
import { TechStack } from "@/components/site/tech-stack";
import { DotPattern } from "@/components/site/dot-pattern";
import { HeroDemo } from "@/components/site/hero-demo";
import { ShowcaseTile } from "@/components/site/showcase-tile";
import { BtcRainbowChart } from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart";
import { FearGreedGauge } from "@/registry/voraui/fear-greed-gauge/fear-greed-gauge";
import { AltseasonGauge } from "@/registry/voraui/altseason-gauge/altseason-gauge";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center">
        <DotPattern className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2" />
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Crypto analytics components
            <br />
            for shadcn/ui
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Open source, install-and-go market components. Real data out of the box from free public
            APIs, full control via props in production.
          </p>
          <div className="flex justify-center">
            <Button render={<a href="#showcase" />} nativeButton={false} size="lg" className="rounded-xl">
              Browse Components
            </Button>
          </div>
          <TechStack />
        </div>
      </section>

      <section id="showcase" className="mt-20 scroll-mt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Showcase</h2>
          <p className="mt-2 text-muted-foreground">Every component, running on real data.</p>
        </div>

        <div className="mt-8 grid gap-4">
          <ShowcaseTile
            href="/docs/trading-chart"
            title="Trading Chart"
            description="Candlesticks, trade markers with clustering, live updates, and a highlight API."
          >
            <HeroDemo height={380} />
          </ShowcaseTile>

          <div className="grid gap-4 sm:grid-cols-3">
            <ShowcaseTile
              className="sm:col-span-2"
              href="/docs/btc-rainbow-chart"
              title="BTC Rainbow Chart"
              description="The classic log-regression rainbow with full history back to 2010. Nine color bands mark valuation zones on a log scale, with range presets and a band-aware tooltip."
            >
              <BtcRainbowChart />
            </ShowcaseTile>

            <div className="grid h-full grid-rows-2 gap-4">
              <ShowcaseTile
                href="/docs/fear-greed-gauge"
                title="Fear & Greed Gauge"
                description="Market sentiment dial powered by alternative.me."
              >
                <FearGreedGauge />
              </ShowcaseTile>
              <ShowcaseTile
                href="/docs/altseason-gauge"
                title="Altseason Gauge"
                description="Altcoin Season index computed client-side from CoinPaprika data. Tracks how many of the top 50 alts are outperforming BTC over a rolling window."
              >
                <AltseasonGauge />
              </ShowcaseTile>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
