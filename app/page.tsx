import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroDemo } from "@/components/site/hero-demo";

const components = [
  {
    name: "trading-chart",
    title: "Trading Chart",
    description: "Candlesticks, trade markers with clustering, live Binance updates, and a highlight API.",
  },
  {
    name: "btc-rainbow-chart",
    title: "BTC Rainbow Chart",
    description: "The classic log-regression rainbow with full history back to 2010.",
  },
  {
    name: "fear-greed-gauge",
    title: "Fear & Greed Gauge",
    description: "Market sentiment dial powered by alternative.me.",
  },
  {
    name: "altseason-gauge",
    title: "Altseason Gauge",
    description: "Altcoin Season index computed client-side from CoinPaprika data.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Crypto analytics components
          <br />
          for shadcn/ui
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Open source, install-and-go market components. Real data out of the box from free public
          APIs, full control via props in production.
        </p>
        <div className="mx-auto w-fit rounded-lg border border-border bg-muted/40 px-4 py-2 font-mono text-sm">
          pnpm dlx shadcn@latest add @voraui/trading-chart
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-border bg-card p-2 sm:p-4">
        <HeroDemo />
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {components.map((c) => (
          <Link key={c.name} href={`/docs/${c.name}`}>
            <Card className="h-full transition-colors hover:border-violet-500/50">
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
