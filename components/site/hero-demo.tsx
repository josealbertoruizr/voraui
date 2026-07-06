"use client";

import * as React from "react";
import { TradingChart } from "@/registry/voraui/trading-chart/trading-chart";
import type { TradeSignal } from "@/registry/voraui/trading-chart/trading-chart-types";

export function HeroDemo({ height = 480 }: { height?: number }) {
  // Three buys on one candle demonstrate the "3B" cluster marker.
  const trades = React.useMemo<TradeSignal[]>(() => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is needed to create timestamps relative to now
    const now = Date.now();
    const h = 3_600_000;
    return [
      { id: "b1", ts: now - 80 * h, side: "BUY", price: 1200 },
      { id: "b2", ts: now - 80 * h, side: "BUY", price: 800 },
      { id: "b3", ts: now - 80 * h, side: "BUY", price: 500 },
      { id: "s1", ts: now - 40 * h, side: "SELL", price: 2600 },
      { id: "b4", ts: now - 18 * h, side: "BUY", price: 1500 },
    ];
  }, []);

  return <TradingChart symbol="BTCUSDT" timeframe="1h" trades={trades} height={height} />;
}
