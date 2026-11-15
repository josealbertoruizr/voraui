import { CodeBlock } from "@/components/site/code-block";
import { ComponentPreview } from "@/components/site/component-preview";
import { DemoPreview } from "@/components/site/demo-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import { FearGreedIndexChartDemo } from "@/components/site/fear-greed-index-chart-demo";
import {
  FearGreedIndexChart,
  FearGreedIndexChartSkeleton,
} from "@/registry/voraui/fear-greed-index-chart";

export const metadata = { title: "Fear & Greed Index Chart" };

export default function Page() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fear &amp; Greed Index Chart</h1>
        <p className="mt-2 text-muted-foreground">
          The crypto Fear &amp; Greed index over time: the full daily history since 2018 as a
          band-colored line, with an optional Bitcoin price line and volume histogram, range
          presets, and a tooltip that names the sentiment zone. When the chart is narrow (plot under
          480px), the zone labels are hidden so the data uses the full width.
        </p>
      </div>

      <DemoPreview source="components/site/fear-greed-index-chart-demo.tsx">
        <FearGreedIndexChartDemo />
      </DemoPreview>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Variants</h2>
        <Tabs defaultValue="price">
          <TabsList>
            <TabsTrigger value="price">Index + price</TabsTrigger>
            <TabsTrigger value="volume">With volume</TabsTrigger>
            <TabsTrigger value="index">Index only</TabsTrigger>
          </TabsList>
          <TabsContent value="price" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The default: the index line with the Bitcoin daily close on a second scale.
            </p>
            <ComponentPreview className="block min-h-0">
              <FearGreedIndexChart />
            </ComponentPreview>
            <CodeBlock code="<FearGreedIndexChart />" lang="tsx" filename="Usage" />
          </TabsContent>
          <TabsContent value="volume" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Adds Bitcoin daily quote volume as a histogram along the bottom.
            </p>
            <ComponentPreview className="block min-h-0">
              <FearGreedIndexChart showVolume />
            </ComponentPreview>
            <CodeBlock code="<FearGreedIndexChart showVolume />" lang="tsx" filename="Usage" />
          </TabsContent>
          <TabsContent value="index" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Only the index. No Bitcoin data is requested.
            </p>
            <ComponentPreview className="block min-h-0">
              <FearGreedIndexChart showPrice={false} />
            </ComponentPreview>
            <CodeBlock
              code="<FearGreedIndexChart showPrice={false} />"
              lang="tsx"
              filename="Usage"
            />
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          FearGreedIndexChart shows this shaped skeleton automatically while its bundled fetcher
          loads. Import FearGreedIndexChartSkeleton directly for a React Suspense fallback or an SSR
          placeholder.
        </p>
        <ComponentPreview className="block min-h-0">
          <FearGreedIndexChartSkeleton />
        </ComponentPreview>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Installation</h2>
        <Tabs defaultValue="cli">
          <TabsList>
            <TabsTrigger value="cli">CLI</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="cli">
            <InstallTabs args="add @voraui/fear-greed-index-chart" />
          </TabsContent>
          <TabsContent value="manual">
            <ManualInstall name="fear-greed-index-chart" />
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Props</h2>
        <PropsTable
          rows={[
            {
              name: "showPrice",
              type: "boolean",
              defaultValue: "true",
              description: "Draw the Bitcoin price line on the left scale.",
            },
            {
              name: "showVolume",
              type: "boolean",
              defaultValue: "false",
              description: "Draw the Bitcoin volume histogram along the bottom.",
            },
            {
              name: "data",
              type: "FearGreedPoint[]",
              description:
                "Your own index series ({ time: unix seconds, value: 0-100 }). When set, the alternative.me fetcher is skipped.",
            },
            {
              name: "btcData",
              type: "BtcDailyPoint[]",
              description:
                "Your own Bitcoin series ({ time: unix seconds, price, volume }). When set, the Binance fetcher is skipped.",
            },
            { name: "className", type: "string", description: "Extra classes for the wrapper." },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data source</h2>
        <p className="text-sm text-muted-foreground">
          The index comes from api.alternative.me/fng/?limit=0: daily values since February 2018,
          fetched keyless. Bitcoin daily closes and quote volume come from api.binance.com klines
          and are requested only when a Bitcoin layer is on. If Binance is unreachable, the chart
          renders the index alone. Dark mode styling requires a next-themes ThemeProvider; without
          one the chart renders with its light theme.
        </p>
        <p className="text-sm text-muted-foreground">
          The chart is drawn with{" "}
          <a
            href="https://www.tradingview.com/lightweight-charts/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline hover:no-underline"
          >
            Lightweight Charts
          </a>{" "}
          by TradingView with its logo turned off. Its license asks for that credit in return, so
          keep a link to tradingview.com somewhere in your app.
        </p>
      </section>
    </main>
  );
}
