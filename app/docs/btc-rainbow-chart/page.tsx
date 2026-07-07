import { ComponentPreview } from "@/components/site/component-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import {
  BtcRainbowChart,
  BtcRainbowLegend,
} from "@/registry/voraui/btc-rainbow-chart/btc-rainbow-chart";

export const metadata = { title: "BTC Rainbow Chart" };

export default function Page() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">BTC Rainbow Chart</h1>
        <p className="mt-2 text-muted-foreground">
          The classic Bitcoin rainbow: nine log-regression bands over the full daily price history
          since 2010, on a logarithmic scale with range presets and a band-aware tooltip.
        </p>
      </div>

      <ComponentPreview className="block min-h-0">
        <div className="w-full max-w-none space-y-4">
          <BtcRainbowChart />
          <BtcRainbowLegend />
        </div>
      </ComponentPreview>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Installation</h2>
        <Tabs defaultValue="cli">
          <TabsList>
            <TabsTrigger value="cli">CLI</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="cli">
            <InstallTabs name="btc-rainbow-chart" />
          </TabsContent>
          <TabsContent value="manual">
            <ManualInstall name="btc-rainbow-chart" />
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Props</h2>
        <PropsTable
          rows={[
            {
              name: "data",
              type: "RainbowPoint[]",
              description:
                "Your own daily series ({ time: unix seconds, price }). When set, the bundled fetcher is skipped.",
            },
            {
              name: "bands",
              type: "RainbowBand[]",
              defaultValue: "DEFAULT_RAINBOW_BANDS",
              description: "Override band labels and colors. Offsets drive the band math.",
            },
            { name: "className", type: "string", description: "Extra classes for the wrapper." },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data source</h2>
        <p className="text-sm text-muted-foreground">
          Two sources spliced client-side: a bundled Coin Metrics seed for 2010-2017 (historical
          closes never change, so it ships with the component) and Binance daily klines from
          2017-08-17 onward, fetched keyless from api.binance.com. Bands are computed analytically
          from the log-regression, so no band data is ever fetched. Dark mode styling requires a
          next-themes ThemeProvider; without one the chart renders with its light theme.
        </p>
      </section>
    </main>
  );
}
