# Vora UI

Vora UI is an open source shadcn registry of crypto market analytics components.
Components install as source code into `components/voraui/<component>/`, so the
host project owns the files and can edit them directly. Do not install a
`voraui` npm package; use the shadcn CLI registry flow.

This page is the complete guide for AI agents adding Vora UI to a project.

- site: https://voraui.vercel.app
- docs: https://voraui.vercel.app/docs
- registry: https://voraui.vercel.app/r/registry.json
- repo: https://github.com/josealbertoruizr/voraui

## Quickstart

Add the registry namespace to `components.json`:

```json
{
  "registries": {
    "@voraui": "https://voraui.vercel.app/r/{name}.json"
  }
}
```

Then install a component:

```sh
pnpm dlx shadcn@latest add @voraui/trading-chart
# or: npx shadcn@latest add @voraui/trading-chart
# or: yarn shadcn@latest add @voraui/trading-chart
# or: bunx --bun shadcn@latest add @voraui/trading-chart
```

The full URL form works without editing `components.json`:

```sh
npx shadcn@latest add https://voraui.vercel.app/r/trading-chart.json
```

Import from the installed source folder:

```tsx
import { TradingChart } from "@/components/voraui/trading-chart";

export function MarketPanel() {
  return <TradingChart symbol="BTCUSDT" timeframe="1h" />;
}
```

## Agent workflow

1. Confirm the target project uses React, Tailwind CSS, and shadcn/ui-style path
   aliases such as `@/components` and `@/lib/utils`.
2. Install only the requested Vora UI component names with the shadcn CLI.
3. Keep the generated files under `components/voraui/<component>/` unless the
   user asks for a different path.
4. Import from each component folder's `index.ts`; avoid deep imports unless a
   helper is not re-exported.
5. If the project has dark mode, make sure `next-themes` or an equivalent theme
   provider is present before using chart components that paint canvases.
6. For production dashboards, prefer user-owned data props over the bundled
   public fetchers when the app already has market data.
7. Run the project's typecheck, lint, or build command after integration.

## Components

| Component | Install name | Import | Default data source | Extra npm dependencies |
| --- | --- | --- | --- | --- |
| Trading Chart | `trading-chart` | `TradingChart` | Binance spot klines | `lightweight-charts`, `next-themes` |
| BTC Rainbow Chart | `btc-rainbow-chart` | `BtcRainbowChart`, `BtcRainbowLegend` | bundled 2010-2017 seed + Binance daily klines | `lightweight-charts`, `next-themes` |
| Fear & Greed Gauge | `fear-greed-gauge` | `FearGreedGauge` | alternative.me Fear & Greed API | `@number-flow/react`, `framer-motion` |
| Altseason Gauge | `altseason-gauge` | `AltseasonGauge` | CoinPaprika tickers | `@number-flow/react`, `framer-motion` |

The shadcn CLI installs declared npm dependencies and registry dependencies.
Manual installs must also provide `@/lib/utils` with `cn()` and any referenced
`@/components/ui/*` primitives.

## Trading Chart

Use for candlesticks, trade markers, same-candle clustering, hover tooltips,
infinite historical scroll, and live candle polling.

```tsx
import { TradingChart, type TradeSignal } from "@/components/voraui/trading-chart";

const trades: TradeSignal[] = [
  { id: "entry-1", ts: Date.now() - 3_600_000, side: "BUY", price: 64200, quantity: 0.1 },
  { id: "exit-1", ts: Date.now() - 900_000, side: "SELL", price: 65100, quantity: 0.1 },
];

export function TradingCard() {
  return (
    <TradingChart
      symbol="BTCUSDT"
      timeframe="1h"
      trades={trades}
      height={520}
      showTooltips
    />
  );
}
```

Props:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `symbol` | `string` | `"BTCUSDT"` | Binance spot symbol. |
| `timeframe` | `"1m" \| "5m" \| "15m" \| "1h" \| "4h" \| "8h" \| "1d" \| "1w" \| "1M"` | `"1h"` | Binance interval. |
| `trades` | `TradeSignal[]` | `[]` | User-owned markers; never fetched by Vora UI. |
| `candles` | `OhlcvCandle[]` | - | Passing candles disables the bundled Binance fetcher and live polling. |
| `live` | `boolean` | `true` | Polls Binance for the latest candle when `candles` is not set. |
| `height` | `number` | `500` | Pixel height of the chart container. |
| `limit` | `number` | `500` | Initial Binance candle count, max 1000. |
| `showTooltips` | `boolean` | `true` | Enables trade marker hover tooltips. |
| `className` | `string` | - | Extra wrapper classes. |

Data shapes:

```ts
type OhlcvCandle = {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isForming?: boolean;
};

type TradeSignal = {
  id: string;
  ts: number; // epoch milliseconds
  side: "BUY" | "SELL";
  price: number;
  quantity?: number;
  note?: string;
  category?: "trade" | "indicator";
  indicator?: string;
  value?: number;
  tradeId?: string;
};
```

## BTC Rainbow Chart

Use for Bitcoin long-term valuation bands on a log scale. It includes range
presets, a band-aware tooltip, and a separate legend component.

```tsx
import { BtcRainbowChart, BtcRainbowLegend } from "@/components/voraui/btc-rainbow-chart";

export function RainbowCard() {
  return (
    <div className="space-y-4">
      <BtcRainbowChart />
      <BtcRainbowLegend />
    </div>
  );
}
```

Props:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `RainbowPoint[]` | - | Daily BTC series. Passing data skips the bundled fetcher. |
| `className` | `string` | - | Extra wrapper classes. |

Data shape:

```ts
type RainbowPoint = {
  time: number; // Unix seconds
  price: number;
};
```

## Fear & Greed Gauge

Use for a live crypto Fear & Greed index dial. It refreshes the bundled
alternative.me fetcher every 10 minutes.

```tsx
import { FearGreedGauge } from "@/components/voraui/fear-greed-gauge";

export function SentimentCard() {
  return <FearGreedGauge variant="wedges" />;
}
```

Props:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `FearGreedData` | - | `{ value, label, updatedAt }`; passing data skips the fetcher. |
| `variant` | `"minimal" \| "ticks" \| "gradient" \| "wedges"` | `"gradient"` | Visual style for the dial. |
| `animateOnLoad` | `boolean` | `true` | Springs the needle in on first render. |
| `className` | `string` | - | Extra wrapper classes. |

Data shape:

```ts
type FearGreedData = {
  value: number | null; // 0-100
  label: string;
  updatedAt: string | null; // upstream unix-seconds timestamp string
};
```

## Altseason Gauge

Use for an Altcoin Season score: the percentage of top clean altcoins
outperforming BTC over a comparison window.

```tsx
import { AltseasonGauge } from "@/components/voraui/altseason-gauge";

export function AltseasonCard() {
  return <AltseasonGauge window="7d" variant="bars" />;
}
```

Props:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `AltseasonData` | - | Passing data skips the bundled CoinPaprika fetcher. |
| `window` | `"24h" \| "7d"` | `"7d"` | Comparison window for the bundled fetcher. Ignored when `data` is set. |
| `variant` | `"meter" \| "bars"` | `"meter"` | Meter track or one bar per compared altcoin. |
| `animateOnLoad` | `boolean` | `true` | Springs the thumb in on first render. |
| `className` | `string` | - | Extra wrapper classes. |

Data shape:

```ts
type AltseasonData = {
  score: number | null; // 0-100
  label: "Altcoin Season" | "Bitcoin Season" | "Mixed" | "Unknown";
  btcChangePct: number | null;
  window: "24h" | "7d";
  compared: number;
  outperforming: number;
};
```

## Skeletons

Each component exports its skeleton for Suspense fallbacks or SSR placeholders:

```tsx
import { TradingChartSkeleton } from "@/components/voraui/trading-chart";
import { BtcRainbowChartSkeleton } from "@/components/voraui/btc-rainbow-chart";
import { FearGreedGaugeSkeleton } from "@/components/voraui/fear-greed-gauge";
import { AltseasonGaugeSkeleton } from "@/components/voraui/altseason-gauge";
```

## Data source rules

- `TradingChart` fetches `https://api.binance.com/api/v3/klines` by default.
- `BtcRainbowChart` uses a bundled 2010-2017 BTC daily seed and Binance daily
  klines from 2017-08-17 onward.
- `FearGreedGauge` fetches `https://api.alternative.me/fng/?limit=1`.
- `AltseasonGauge` fetches `https://api.coinpaprika.com/v1/tickers?quotes=USD`
  and computes the score client-side.
- Public fetchers are free and keyless, but production apps should pass owned
  data props when they need reliability, caching, rate-limit control, or a
  non-Binance venue.

## Integration notes

- All Vora UI components are client components and include `"use client"`.
- For Next.js App Router, import them directly from Server Components only when
  props are serializable. Put callbacks or browser-only surrounding logic in a
  client wrapper.
- `TradingChart` and `BtcRainbowChart` render with `lightweight-charts`; give
  them stable visible dimensions and avoid placing them in initially hidden
  zero-width containers.
- Dark mode for chart canvases follows `next-themes`. Without a provider, chart
  canvases render in their light theme.
- `TradeSignal.ts` times use epoch milliseconds; `OhlcvCandle.time` and
  `RainbowPoint.time` use Unix seconds.
- Keep installed files editable. If the user asks for custom behavior, modify
  the copied component source in `components/voraui/<component>/`.

## Manual install

If the shadcn CLI cannot be used, download a component zip:

```text
https://voraui.vercel.app/d/trading-chart.zip
https://voraui.vercel.app/d/btc-rainbow-chart.zip
https://voraui.vercel.app/d/fear-greed-gauge.zip
https://voraui.vercel.app/d/altseason-gauge.zip
```

Extract it into `components/voraui/<component>/`, install the npm dependencies
listed in the registry item, and adjust `@/lib/utils` or `@/components/ui/*`
imports if the host project uses different aliases.
