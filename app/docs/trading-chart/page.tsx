import { InstallTabs } from "@/components/site/install-tabs";
import { PropsTable } from "@/components/site/props-table";
import { TradingChartDemo } from "@/components/site/trading-chart-demo";

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
        <h2 className="text-xl font-semibold">Installation</h2>
        <InstallTabs name="trading-chart" />
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
            { name: "showTooltips", type: "boolean", defaultValue: "true", description: "Show trade tooltips on hover/click." },
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
            {
              name: "scrollToTimestamp",
              type: "(timestamp) => void",
              description: "Animate the visible range to center a timestamp (seconds or ms).",
            },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data source</h2>
        <p className="text-sm text-muted-foreground">
          GET https://api.binance.com/api/v3/klines. Free, keyless, CORS-enabled. Trades are always
          your own data, passed via the trades prop.
        </p>
      </section>
    </main>
  );
}
