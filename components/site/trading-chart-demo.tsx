"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { TradingChart } from "@/registry/voraui/trading-chart/trading-chart";
import type { TradeSignal, TradingChartHandle } from "@/registry/voraui/trading-chart/trading-chart-types";

export function TradingChartDemo() {
  const ref = React.useRef<TradingChartHandle>(null);

  const trades = React.useMemo<TradeSignal[]>(() => {
    // eslint-disable-next-line react-hooks/purity -- Date.now() is needed to create timestamps relative to now
    const now = Date.now();
    const h = 3_600_000;
    // Spread across ~1 week (168h) of 1h history, with a 3-buy cluster (3B)
    // and a couple of noted trades so the tooltip variety shows too.
    return [
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
  }, []);

  const lastBuy = trades.find((t) => t.id === "b5")!;
  const sell = trades.find((t) => t.id === "s2")!;

  return (
    <div className="space-y-3">
      <TradingChart ref={ref} symbol="BTCUSDT" timeframe="1h" trades={trades} height={440} limit={168} />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.highlightTrade(lastBuy.ts, lastBuy.price, "BUY")}
        >
          Highlight last buy
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ref.current?.highlightTrade(sell.ts, sell.price, "SELL")}
        >
          Highlight sell
        </Button>
        <Button size="sm" variant="ghost" onClick={() => ref.current?.clearHighlight()}>
          Clear
        </Button>
      </div>
    </div>
  );
}
