"use client";

import * as React from "react";
import {
  TradingChart,
  TradingChartSkeleton,
  type OhlcvCandle,
  type TradeSignal,
} from "@/registry/voraui/trading-chart";
import { fetchKlines } from "@/registry/voraui/trading-chart/hooks/use-klines";

// This is a landing-page preview tile, not the interactive component demo on
// /docs/trading-chart: it fetches a fixed one-week window itself and hands it
// to TradingChart via the `candles` prop. That's the component's existing,
// documented escape hatch for supplying your own data - it disables the
// bundled fetcher's history-on-scroll pagination and live polling entirely
// (see trading-chart.tsx's candlesProp handling), so this preview can never
// balloon past one week regardless of how a visitor scrolls or drags it.
export function HeroDemo({ height = 480 }: { height?: number }) {
  const [candles, setCandles] = React.useState<OhlcvCandle[] | null>(null);

  React.useEffect(() => {
    let active = true;
    fetchKlines("BTCUSDT", "1h", { limit: 168 }).then((klines) => {
      if (active) setCandles(klines);
    });
    return () => {
      active = false;
    };
  }, []);

  // A dense trade tape - several clusters (3B, 2S, 2B) plus a steady drip of
  // singles - so the preview reads as "this chart is built for a lot of
  // trades," not just a couple of demo markers.
  const trades = React.useMemo<TradeSignal[]>(() => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is needed to create timestamps relative to now
    const now = Date.now();
    const h = 3_600_000;
    return [
      { id: "t1", ts: now - 165 * h, side: "BUY", price: 350, note: "First entry" },
      { id: "t2", ts: now - 155 * h, side: "SELL", price: 700 },
      { id: "t3", ts: now - 148 * h, side: "BUY", price: 500 },
      { id: "t4", ts: now - 148 * h, side: "BUY", price: 750 },
      { id: "t5", ts: now - 138 * h, side: "SELL", price: 900 },
      { id: "t6", ts: now - 130 * h, side: "BUY", price: 650 },
      { id: "t7", ts: now - 122 * h, side: "SELL", price: 1100 },
      { id: "t8", ts: now - 114 * h, side: "BUY", price: 800 },
      { id: "t9", ts: now - 106 * h, side: "SELL", price: 950 },
      { id: "t10", ts: now - 98 * h, side: "BUY", price: 700 },
      { id: "t11", ts: now - 90 * h, side: "SELL", price: 1200, note: "Trim" },
      { id: "t12", ts: now - 82 * h, side: "BUY", price: 1200 },
      { id: "t13", ts: now - 82 * h, side: "BUY", price: 800 },
      { id: "t14", ts: now - 82 * h, side: "BUY", price: 500 },
      { id: "t15", ts: now - 74 * h, side: "SELL", price: 1500 },
      { id: "t16", ts: now - 66 * h, side: "BUY", price: 900 },
      { id: "t17", ts: now - 58 * h, side: "SELL", price: 1050 },
      { id: "t18", ts: now - 50 * h, side: "BUY", price: 1100 },
      { id: "t19", ts: now - 42 * h, side: "SELL", price: 1400 },
      { id: "t20", ts: now - 34 * h, side: "BUY", price: 950, note: "Dip buy" },
      { id: "t21", ts: now - 26 * h, side: "SELL", price: 1600 },
      { id: "t22", ts: now - 18 * h, side: "BUY", price: 1050 },
      { id: "t23", ts: now - 18 * h, side: "BUY", price: 700 },
      { id: "t24", ts: now - 10 * h, side: "SELL", price: 1900 },
      { id: "t25", ts: now - 6 * h, side: "BUY", price: 1300 },
      { id: "t26", ts: now - 3 * h, side: "SELL", price: 2200, note: "Take profit" },
      { id: "t27", ts: now - 1 * h, side: "BUY", price: 1500 },
    ];
  }, []);

  if (!candles) return <TradingChartSkeleton height={height} />;

  return <TradingChart symbol="BTCUSDT" timeframe="1h" trades={trades} candles={candles} height={height} />;
}
