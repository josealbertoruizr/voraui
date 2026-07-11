import type { OhlcvCandle, TradeSide } from "./trading-chart-types";
import { BUY_COLOR, SELL_COLOR } from "./markers";
import { normalizeToSeconds, toChartTime } from "./chart-time";

export interface TradeGlowDeps {
  container: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lightweight-charts instances are only available via dynamic import; typing this precisely would force an eager import.
  getChart: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see getChart above.
  getSeries: () => any;
  getCandles: () => OhlcvCandle[];
  getTimeframe: () => string;
}

export interface TradeGlow {
  /** Pulse the glow at the trade's candle; auto-clears after 10 seconds. */
  highlight: (timestampMs: number, price: number, side: TradeSide) => void;
  clear: () => void;
  /** Reposition after pan/zoom; subscribe to visible range changes. */
  updatePosition: () => void;
  dispose: () => void;
}

const STYLE_ID = "voraui-trade-glow-styles";
const HIGHLIGHT_MS = 10_000;

export function createTradeGlow({
  container,
  getChart,
  getSeries,
  getCandles,
  getTimeframe,
}: TradeGlowDeps): TradeGlow {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes vorauiTradeGlowRing {
        0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.9; }
        70%  { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        100% { transform: translate(-50%,-50%) scale(0.5); opacity: 0; }
      }
      @keyframes vorauiTradeGlowDot {
        0%, 100% { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
        50%      { transform: translate(-50%,-50%) scale(1.3); opacity: 0.65; }
      }
    `;
    document.head.appendChild(style);
  }

  const ring = document.createElement("div");
  Object.assign(ring.style, {
    position: "absolute",
    pointerEvents: "none",
    zIndex: "44",
    display: "none",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "2px solid transparent",
    animation: "vorauiTradeGlowRing 1.6s ease-out infinite",
  } as Partial<CSSStyleDeclaration>);
  container.appendChild(ring);

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "absolute",
    pointerEvents: "none",
    zIndex: "45",
    display: "none",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    animation: "vorauiTradeGlowDot 1.2s ease-in-out infinite",
  } as Partial<CSSStyleDeclaration>);
  container.appendChild(dot);

  let highlighted: { timestampMs: number; price: number; side: TradeSide } | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const hide = () => {
    ring.style.display = "none";
    dot.style.display = "none";
  };

  const updatePosition = () => {
    const chart = getChart();
    const series = getSeries();
    if (!highlighted || !chart || !series) {
      hide();
      return;
    }

    const targetSec = normalizeToSeconds(highlighted.timestampMs);

    // Find the closest candle to get the bar's actual low/high.
    const candles = getCandles();
    const closest = candles.length
      ? candles.reduce(
          (best, c) => (Math.abs(c.time - targetSec) < Math.abs(best.time - targetSec) ? c : best),
          candles[0],
        )
      : null;

    // Place the glow near the marker: belowBar for BUY (low), aboveBar for SELL (high).
    const glowPrice =
      highlighted.side === "BUY" ? (closest?.low ?? highlighted.price) : (closest?.high ?? highlighted.price);

    // Use the closest bar's open time for the x lookup: timeToCoordinate only
    // resolves times that exist on the scale, and real trade timestamps
    // rarely land exactly on a bar open.
    const barSec = closest ? closest.time : targetSec;
    const x = chart.timeScale().timeToCoordinate(toChartTime(barSec, getTimeframe()));
    const y = series.priceToCoordinate(glowPrice);

    if (x == null || y == null) {
      hide();
      return;
    }

    const color = highlighted.side === "BUY" ? BUY_COLOR : SELL_COLOR;
    const shadow =
      highlighted.side === "BUY" ? "0 0 8px 3px rgba(0,193,118,0.6)" : "0 0 8px 3px rgba(207,48,74,0.6)";

    for (const el of [ring, dot]) {
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, display: "block", boxShadow: shadow });
    }
    ring.style.borderColor = color;
    dot.style.background = color;
  };

  return {
    highlight: (timestampMs, price, side) => {
      if (timeout) clearTimeout(timeout);
      highlighted = { timestampMs, price, side };
      updatePosition();
      timeout = setTimeout(() => {
        highlighted = null;
        updatePosition();
      }, HIGHLIGHT_MS);
    },
    clear: () => {
      if (timeout) clearTimeout(timeout);
      highlighted = null;
      updatePosition();
    },
    updatePosition,
    dispose: () => {
      if (timeout) clearTimeout(timeout);
      ring.remove();
      dot.remove();
    },
  };
}
