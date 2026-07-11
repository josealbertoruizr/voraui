"use client";

import { TradingChart } from "@/registry/voraui/trading-chart/trading-chart";
import type { TradeSignal } from "@/registry/voraui/trading-chart/trading-chart-types";

const now = Date.now();
const h = 3_600_000;

// Trades spread across ~1 week of 1h history, with a 3-buy cluster (3B)
// and a couple of noted trades so the tooltip variety shows too.
const trades: TradeSignal[] = [
  { id: "h1", ts: now - 160 * h, side: "BUY", price: 400, note: "First entry" },
  { id: "h2", ts: now - 140 * h, side: "SELL", price: 900 },
  { id: "h3", ts: now - 120 * h, side: "BUY", price: 800 },
  { id: "h4", ts: now - 100 * h, side: "SELL", price: 1500 },
  { id: "b1", ts: now - 80 * h, side: "BUY", price: 1200 },
  { id: "b2", ts: now - 80 * h, side: "BUY", price: 800 },
  { id: "b3", ts: now - 80 * h, side: "BUY", price: 500 },
  { id: "s1", ts: now - 55 * h, side: "SELL", price: 1500, note: "Trim" },
  { id: "b4", ts: now - 35 * h, side: "BUY", price: 1200, note: "Dip buy" },
  { id: "s2", ts: now - 15 * h, side: "SELL", price: 2600, note: "Take profit" },
  { id: "b5", ts: now - 5 * h, side: "BUY", price: 1500 },
];

export function TradingChartDemo() {
  return (
    <TradingChart
      symbol="BTCUSDT"
      timeframe="1h"
      trades={trades}
      height={440}
      limit={168}
    />
  );
}
