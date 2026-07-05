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
    return [
      { id: "b1", ts: now - 90 * h, side: "BUY", price: 1000 },
      { id: "b2", ts: now - 90 * h, side: "BUY", price: 700 },
      { id: "b3", ts: now - 90 * h, side: "BUY", price: 300 },
      { id: "s1", ts: now - 45 * h, side: "SELL", price: 2200 },
      { id: "b4", ts: now - 20 * h, side: "BUY", price: 900 },
    ];
  }, []);

  const lastBuy = trades[4];
  const sell = trades[3];

  return (
    <div className="space-y-3">
      <TradingChart ref={ref} symbol="BTCUSDT" timeframe="1h" trades={trades} height={440} />
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
