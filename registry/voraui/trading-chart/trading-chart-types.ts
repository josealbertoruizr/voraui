export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "8h" | "1d" | "1w" | "1M";

export interface OhlcvCandle {
  /** Unix seconds (candle open time). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** True while the candle is still open (live updates). */
  isForming?: boolean;
}

export type TradeSide = "BUY" | "SELL";

export interface TradeSignal {
  id: string;
  /** Execution time in epoch milliseconds. */
  ts: number;
  side: TradeSide;
  /** Execution price. When quantity is set, tooltips show price * quantity as the position size; otherwise price itself is treated as the position size in quote currency. */
  price: number;
  quantity?: number;
  note?: string;
  category?: "trade" | "indicator";
  indicator?: string;
  value?: number;
  /** Links buy/sell pairs, e.g. for PnL grouping. */
  tradeId?: string;
}

export interface TradingChartProps {
  /** Binance spot symbol, e.g. "BTCUSDT". */
  symbol?: string;
  timeframe?: Timeframe;
  /** Trade/indicator markers to draw on the chart. Always the user's own data. */
  trades?: TradeSignal[];
  /** Provide your own candles to bypass the bundled Binance fetcher. */
  candles?: OhlcvCandle[];
  /** Poll Binance for live candle updates. Ignored when candles is set. */
  live?: boolean;
  height?: number;
  /** Number of candles for the initial load (Binance max 1000). */
  limit?: number;
  showTooltips?: boolean;
  className?: string;
}
