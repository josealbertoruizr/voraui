# Vora UI

Open source crypto market analytics components for [shadcn/ui](https://ui.shadcn.com).
Components install as source code into your project via the shadcn CLI, so you own every line.

Docs and live demos: https://voraui.vercel.app

## Components

- **Trading Chart** (flagship) - candlesticks with B/S trade markers, same-candle clustering (`3B`), hover tooltips, infinite history on scroll, live Binance updates, and an imperative highlight API with a sonar-ring glow.
- **BTC Rainbow Chart** - the classic log-regression rainbow over the full daily price history since 2010, with a bundled 2010-2017 seed.
- **Fear & Greed Gauge** - the crypto Fear & Greed index as an SVG dial, live from alternative.me.
- **Altseason Gauge** - the Altcoin Season index computed client-side from CoinPaprika data.

Every component renders real data out of the box from free, keyless public APIs (alternative.me, CoinPaprika, Binance).
For production, every component accepts your own data via props and the bundled fetcher is skipped.

## Installation

Add the registry to your `components.json`:

```json
{
  "registries": {
    "@voraui": "https://voraui.vercel.app/r/{name}.json"
  }
}
```

Then add components:

```bash
pnpm dlx shadcn@latest add @voraui/trading-chart
```

Or use the zero-config full URL form:

```bash
npx shadcn@latest add https://voraui.vercel.app/r/trading-chart.json
```

See the [installation guide](https://voraui.vercel.app/docs) for details, and each component's docs page for props and data source notes.

## Development

Requires Node 22 and pnpm.

```bash
pnpm install
pnpm dev             # docs site + registry at localhost:3000
pnpm test            # vitest unit tests
pnpm registry:build  # emit public/r/*.json
pnpm build           # registry build + next build
```

Component sources live in `registry/voraui/<item>/`; the docs site imports them directly, so the demo pages are the end-to-end test of every component.

## License

[MIT](LICENSE)
