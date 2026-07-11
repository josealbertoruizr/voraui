import { ComponentPreview } from "@/components/site/component-preview";
import { InstallTabs } from "@/components/site/install-tabs";
import { ManualInstall } from "@/components/site/manual-install";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropsTable } from "@/components/site/props-table";
import { TradingChartDemo } from "@/components/site/trading-chart-demo";
import { TradingChartSkeleton } from "@/registry/voraui/trading-chart/trading-chart-skeleton";

export const metadata = { title: "Trading Chart" };

export default function Page() {
  return (
    <main className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trading Chart</h1>
        <p className="mt-2 text-muted-foreground">
          A candlestick chart for showing your trades on live market data: B/S markers with
          same-candle clustering (3B), hover tooltips with trade details, infinite history on
          scroll, live candle updates, and an imperative highlight API with a sonar-ring glow.
        </p>
      </div>

      <TradingChartDemo />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <p className="text-sm text-muted-foreground">
          TradingChart shows this shaped skeleton automatically while its bundled fetcher loads.
          Import TradingChartSkeleton directly for a React Suspense fallback or an SSR placeholder.
        </p>
        <ComponentPreview className="block min-h-0">
          <TradingChartSkeleton height={360} />
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
            <InstallTabs name="trading-chart" />
          </TabsContent>
          <TabsContent value="manual">
            <ManualInstall name="trading-chart" />
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Props</h2>
        <PropsTable
          rows={[
            { name: "symbol", type: "string", defaultValue: '"BTCUSDT"', description: "Binance spot symbol." },
            {
              name: "timeframe",
              type: "Timeframe",
              defaultValue: '"1h"',
              description: 'One of "1m" | "5m" | "15m" | "1h" | "4h" | "8h" | "1d" | "1w" | "1M".',
            },
            {
              name: "trades",
              type: "TradeSignal[]",
              defaultValue: "[]",
              description: "Your trades and indicator signals, rendered as chart markers.",
            },
            {
              name: "candles",
              type: "OhlcvCandle[]",
              description:
                "Your own candle data. When set, the bundled Binance fetcher and live polling are disabled.",
            },
            { name: "live", type: "boolean", defaultValue: "true", description: "Poll Binance for live candle updates." },
            { name: "height", type: "number", defaultValue: "500", description: "Chart height in pixels." },
            { name: "limit", type: "number", defaultValue: "500", description: "Candles for the initial load (max 1000)." },
            { name: "showTooltips", type: "boolean", defaultValue: "true", description: "Show trade tooltips on hover." },
            { name: "className", type: "string", description: "Extra classes for the wrapper." },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Ref API</h2>
        <PropsTable
          rows={[
            {
              name: "highlightTrade",
              type: "(tsMs, price, side) => void",
              description: "Pulse a sonar-ring glow at the trade's candle for 10 seconds.",
            },
            { name: "clearHighlight", type: "() => void", description: "Remove the glow immediately." },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data source</h2>
        <p className="text-sm text-muted-foreground">
          GET https://api.binance.com/api/v3/klines. Free, keyless, CORS-enabled. Trades are always
          your own data, passed via the trades prop. Dark mode styling requires a next-themes
          ThemeProvider; without one the chart renders with its light theme.
        </p>
      </section>
    </main>
  );
}
