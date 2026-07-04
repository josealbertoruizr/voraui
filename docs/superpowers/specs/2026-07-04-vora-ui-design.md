# Vora UI - Design Spec

Date: 2026-07-04
Status: Approved for planning

## Overview

Vora UI is an open source, shadcn-style component registry for crypto market analytics components.
Users install components as source code into their own projects via the shadcn CLI, the same distribution model as MagicUI.
The project has its own identity and branding, independent from the Vora trading app.
It lives in its own repository (`voraui`) and is hosted free on Vercel.

## Goals

- Ship high quality, installable crypto analytics components that do not exist elsewhere as a library.
- "Install and go" first-run experience: every component renders real data out of the box using free public APIs.
- Full control for production users: every component accepts data via props, bypassing the bundled fetcher.
- MagicUI-tier polish on the docs site: live demos, tabbed install commands, dark and light themes.

## v1 Components

1. **Fear & Greed gauge** - data from the free alternative.me API.
2. **Altseason index gauge** - data from the free CoinPaprika API (top-50 alts vs BTC, blockchaincenter.net convention); the score computation moves from Vora's backend into the shipped hook.
3. **BTC Rainbow chart** - Binance daily klines from 2017-08-17 onward plus a bundled 2010-2017 daily close seed (52 KB CSV from Vora's backend), with the band math from Vora's `rainbowBandsPrimitive.ts` and `market.py`.
4. **Trading chart** (flagship) - candlestick chart built on lightweight-charts with:
   - B/S trade markers with clustering (`3B` when trades stack on one candle).
   - Hover to see trade details.
   - Imperative ref API (`highlightTrade()`) with the sonar-ring glow effect.
   - Live candle updates from Binance public klines (`api.binance.com/api/v3/klines`, keyless and CORS-enabled).
   - Trades supplied via a documented `trades` prop; they are inherently the user's own data.

Source components are extracted from the Vora app repo.
Full snapshots of every source file, plus backend computation context and data source notes, live in `docs/vora-reference/` (see its `INDEX.md`), so development never needs the Vora repo.

Explicitly out of v1: liquidation heatmap (no free data source), market treemap (CoinGecko already ships a free widget), funding rates card, npm package distribution, sector grouping.

## Architecture

One repository, one Next.js app: the docs site and the registry are the same Vercel deployment.

```
voraui/
├── registry/voraui/           # component sources (what users install)
│   ├── fear-greed-gauge/      #   fear-greed-gauge.tsx + use-fear-greed.ts
│   ├── altseason-gauge/       #   altseason-gauge.tsx + use-altseason.ts
│   ├── btc-rainbow-chart/     #   chart + rainbow-bands.ts + use-btc-history.ts
│   └── trading-chart/         #   trading-chart.tsx + use-klines.ts + types.ts
├── registry.json              # shadcn registry manifest (deps per component)
├── public/r/*.json            # `shadcn build` output, the install URLs
└── app/                       # landing + one docs page per component, live demos
```

Each registry item declares its own npm dependencies (`lightweight-charts`, `framer-motion`) and shadcn dependencies (`button`, `badge`, `switch`, `label`), so the CLI installs everything a component needs.

## Extraction Rules

These rules apply to every component copied from Vora.

- No Vora backend imports.
  Bundled hooks fetch public APIs directly (alternative.me, CoinPaprika, Binance klines).
- Hooks are plain `fetch` with `useState`/`useEffect`.
  No TanStack Query dependency; users who want caching wrap the component themselves.
- Every component accepts `data` as a prop override.
  The bundled hook is the convenience path; props are the production path.
- No `@/types` imports.
  Each registry item ships its own `types.ts`.
- Keep semantic Tailwind tokens (`bg-card`, `text-muted-foreground`) so components inherit the user's shadcn theme in both light and dark mode.
- The trading chart keeps its best features (markers, clustering, imperative highlight API, live updates) but drops Vora-specific wiring.

## Install UX

Namespaced registry, matching the MagicUI experience.

Stage 1 (day one): users add one line to their `components.json`:

```json
{
  "registries": {
    "@voraui": "https://voraui.vercel.app/r/{name}.json"
  }
}
```

Then any of these work:

```bash
pnpm dlx shadcn@latest add @voraui/trading-chart
npx shadcn@latest add @voraui/trading-chart
bunx --bun shadcn@latest add @voraui/trading-chart
yarn shadcn@latest add @voraui/trading-chart
```

The full URL form (`npx shadcn@latest add https://voraui.vercel.app/r/trading-chart.json`) always works with zero config.

Stage 2: once the site is live with components published, submit Vora UI to shadcn's official registry directory.
After acceptance, `@voraui/<name>` works with no user config, and Vora UI appears in shadcn's public registry index.

A custom domain can replace `voraui.vercel.app` later without breaking the structure.

## Docs Site v1

- Landing page with the trading chart as the hero demo.
- One docs page per component: live demo, tabbed install commands per package manager, props table, data source notes.
- Installation guide page with the `components.json` registry config snippet.
- Own branding: name, logo, OG image, designed during implementation.

## Testing

- Demo pages on the docs site act as the end-to-end verification for every component.
- Unit tests for pure math: rainbow band computation, altseason index calculation, marker clustering.
- `shadcn build` output validated by installing a component into a scratch Next.js project before each release.

## Deployment

- GitHub repo: `josealbertoruizr/voraui`, public (open source).
- Hosting: Vercel free tier, auto-deploy from `main`.
