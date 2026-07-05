"use client";

import * as React from "react";
import { forwardRef, useImperativeHandle } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type {
  OhlcvCandle,
  TradeSide,
  TradeSignal,
  TradingChartHandle,
  TradingChartProps,
} from "./types";
import { sanitizeCandles, isValidCandle } from "./candle-validation";
import { useKlines, useLatestCandlePolling } from "./use-klines";
import {
  alignSignalsToBars,
  buildSeriesMarkers,
  BUY_COLOR,
  SELL_COLOR,
  INDICATOR_COLOR,
  type AlignedSignal,
} from "./markers";

const TradingChart = forwardRef<TradingChartHandle, TradingChartProps>(function TradingChart(
  {
    symbol = "BTCUSDT",
    timeframe = "1h",
    trades = [],
    candles: candlesProp,
    live = true,
    height = 500,
    limit = 500,
    showTooltips = true,
    className,
  },
  ref,
) {
  const { resolvedTheme } = useTheme();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lightweight-charts's chart instance is only available via dynamic import; typing this precisely would force an eager import.
  const chartRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see chartRef above.
  const seriesRef = React.useRef<any>(null);
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see chartRef above.
  const markersPluginRef = React.useRef<any>(null);
  const isStickyRef = React.useRef(false);
  const isAutoFitDoneRef = React.useRef(false);

  const showDetailsRef = React.useRef(showTooltips);

  // Sync refs for event handlers to avoid stale closures.
  const candlesRef = React.useRef<OhlcvCandle[]>([]);
  const tradesRef = React.useRef<TradeSignal[]>([]);
  const timeframeRef = React.useRef<string>(timeframe);
  const lastCandlesLengthRef = React.useRef(0);
  const lastKeyRef = React.useRef(`${symbol}-${timeframe}`);
  const lastClosedTimeRef = React.useRef<number>(0);
  const isResettingRef = React.useRef(false);
  const animationRef = React.useRef<number | null>(null);

  // Trade highlight glow.
  const glowRingRef = React.useRef<HTMLDivElement | null>(null);
  const glowRing2Ref = React.useRef<HTMLDivElement | null>(null);
  const glowDotRef = React.useRef<HTMLDivElement | null>(null);
  const highlightedTradeRef = React.useRef<{ timestampMs: number; price: number; side: TradeSide } | null>(null);
  const updateGlowRef = React.useRef<(() => void) | null>(null);
  const glowTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    highlightTrade: (timestampMs: number, price: number, side: TradeSide) => {
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
      highlightedTradeRef.current = { timestampMs, price, side };
      updateGlowRef.current?.();
      glowTimeoutRef.current = setTimeout(() => {
        highlightedTradeRef.current = null;
        updateGlowRef.current?.();
      }, 10000);
    },
    clearHighlight: () => {
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
      highlightedTradeRef.current = null;
      updateGlowRef.current?.();
    },
    scrollToTimestamp: (timestamp: number) => {
      if (!chartRef.current || !seriesRef.current || !candlesRef.current.length) return;

      const timeScale = chartRef.current.timeScale();
      const normalizedTs = timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;

      const sanitized = sanitizeCandles(candlesRef.current);
      if (!sanitized.length) return;

      let targetIdx = sanitized.findIndex((c) => c.time === normalizedTs);

      if (targetIdx === -1) {
        // Fallback: find the closest preceding candle.
        for (let i = sanitized.length - 1; i >= 0; i--) {
          if (sanitized[i].time <= normalizedTs) {
            targetIdx = i;
            break;
          }
        }
      }

      if (targetIdx === -1) return;

      // Center the target and show ~80 bars of context.
      const barsToShow = 80;
      const targetRange = {
        from: targetIdx - Math.floor(barsToShow / 2),
        to: targetIdx + Math.ceil(barsToShow / 2),
      };

      const startRange = timeScale.getVisibleLogicalRange();
      if (!startRange) return;

      const startTime = performance.now();
      const duration = 4000;

      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: easeInOutCubic.
        const ease =
          progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentFrom = startRange.from + (targetRange.from - startRange.from) * ease;
        const currentTo = startRange.to + (targetRange.to - startRange.to) * ease;

        timeScale.setVisibleLogicalRange({ from: currentFrom, to: currentTo });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
  }));

  const { candles, setCandles, loading, error, fetchMore, hasMoreHistory } = useKlines(symbol, timeframe, {
    limit,
    enabled: candlesProp === undefined,
  });

  // If candles are supplied via props, render them instead of the fetched ones.
  const effectiveCandles = candlesProp ?? candles;

  const hasOverrideCandlesRef = React.useRef(candlesProp !== undefined);
  React.useEffect(() => {
    hasOverrideCandlesRef.current = candlesProp !== undefined;
  }, [candlesProp]);

  React.useEffect(() => {
    candlesRef.current = effectiveCandles;
  }, [effectiveCandles]);
  React.useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);
  React.useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);
  React.useEffect(() => {
    showDetailsRef.current = showTooltips;
    if (!showTooltips && tooltipRef.current) {
      tooltipRef.current.style.display = "none";
    }
  }, [showTooltips]);

  const updateTooltipContent = (el: HTMLDivElement, list: AlignedSignal[], pt: { x: number; y: number }) => {
    const signal = list[0];
    const count = list.length;
    el.style.left = `${pt.x}px`;
    el.style.top = `${pt.y}px`;
    el.style.display = "block";

    const indicatorSignals = list.filter((s) => s.category === "indicator");
    const tradeSignals = list.filter((s) => s.category !== "indicator");
    const buys = tradeSignals.filter((s) => s.side === "BUY");
    const sells = tradeSignals.filter((s) => s.side === "SELL");

    const renderSignal = (s: AlignedSignal) => {
      if (s.category === "indicator") {
        const indicatorLabel = s.indicator || "Indicator";
        const indicatorValue =
          typeof s.value === "number" && Number.isFinite(s.value) ? ` (${s.value.toFixed(2)})` : "";
        const note = s.note ? `<div style="font-size:10px;opacity:0.7;">${s.note}</div>` : "";
        return `
          <div style="display:flex;flex-direction:column;margin-top:4px;gap:2px;">
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;">
              <b style="color:${s.side === "BUY" ? BUY_COLOR : SELL_COLOR}">${indicatorLabel} ${s.side}${indicatorValue}</b>
            </div>
            ${note}
          </div>
        `;
      }

      const price = Number(s.price);
      const qty = Number(s.quantity || 0);
      const totalAmount = price < 5000 ? price : price * qty;

      // Use the note as asset price if it is a valid number (e.g. BTC price at buy).
      const notePrice = Number(s.note);
      const assetPrice = !isNaN(notePrice) && notePrice > 0 ? notePrice : price < 5000 ? 0 : price;

      const priceDisplay = assetPrice > 0 ? ` at ${assetPrice.toLocaleString()}` : "";

      return `
        <div style="display:flex;flex-direction:column;margin-top:4px;gap:1px;">
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;">
            <b style="color:${s.side === "BUY" ? BUY_COLOR : SELL_COLOR}">${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} usd${priceDisplay}</b>
          </div>
        </div>
      `;
    };

    if (!showDetailsRef.current) {
      el.style.display = "none";
      return;
    }

    const hasSignals = list.length > 0;

    el.innerHTML = `
      <div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:600;font-size:13px;">${new Date(signal.ts).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
        <span style="font-size:10px;opacity:0.6;background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:4px;">${count} Signals</span>
      </div>

      ${hasSignals ? `
        ${indicatorSignals.length > 0 ? `
          <div style="margin-top:6px">
            <div style="color:${INDICATOR_COLOR};font-size:10px;text-transform:uppercase;font-weight:bold;margin-bottom:2px">Indicator Signals</div>
            ${indicatorSignals.slice(0, 8).map(renderSignal).join("")}
          </div>
        ` : ""}
        ${buys.length > 0 ? `
          <div style="margin-top:6px">
            <div style="color:${BUY_COLOR};font-size:10px;text-transform:uppercase;font-weight:bold;margin-bottom:2px">Buy Signals</div>
            ${buys.slice(0, 5).map(renderSignal).join("")}
          </div>
        ` : ""}
        ${sells.length > 0 ? `
          <div style="margin-top:8px">
            <div style="color:${SELL_COLOR};font-size:10px;text-transform:uppercase;font-weight:bold;margin-bottom:2px">Sell Signals</div>
            ${sells.slice(0, 5).map(renderSignal).join("")}
          </div>
        ` : ""}
      ` : ""}

      ${isStickyRef.current ? `
        <div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-size:9px;opacity:0.5;text-align:center;">
          Click again to unlock
        </div>
      ` : ""}
    `;
  };

  const [showNoMoreData, setShowNoMoreData] = React.useState(false);
  const noMoreDataTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Brief notification when the user hits the historical data boundary.
  React.useEffect(() => {
    if (!hasMoreHistory && !loading && candles.length > 0 && candlesProp === undefined) {
      setShowNoMoreData(true);
      if (noMoreDataTimerRef.current) clearTimeout(noMoreDataTimerRef.current);
      noMoreDataTimerRef.current = setTimeout(() => setShowNoMoreData(false), 4000);
    } else {
      setShowNoMoreData(false);
    }
    return () => {
      if (noMoreDataTimerRef.current) clearTimeout(noMoreDataTimerRef.current);
    };
  }, [hasMoreHistory, loading, candles.length, candlesProp]);

  const fetchMoreRef = React.useRef(fetchMore);
  React.useEffect(() => {
    fetchMoreRef.current = fetchMore;
  }, [fetchMore]);

  const isLoadingMoreRef = React.useRef(false);
  const hasMoreHistoryRef = React.useRef(hasMoreHistory);
  React.useEffect(() => {
    // With prop-supplied candles there is no more history to fetch.
    hasMoreHistoryRef.current = candlesProp !== undefined ? false : hasMoreHistory;
  }, [hasMoreHistory, candlesProp]);
  const oldestTimestampRef = React.useRef<number | null>(null);

  // Apply theme changes.
  React.useEffect(() => {
    if (!chartRef.current) return;
    const textColor = resolvedTheme === "dark" ? "#9CA3AF" : "#374151";
    const gridColor = resolvedTheme === "dark" ? "rgba(148,163,184,0.12)" : "rgba(0,0,0,0.05)";

    chartRef.current.applyOptions({
      layout: {
        background: { type: "solid", color: "rgba(0,0,0,0)" },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
    });
  }, [resolvedTheme]);

  // Initialize chart.
  React.useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    let chartInitialized = false;

    const initChart = async (container: HTMLDivElement) => {
      const { createChart, CandlestickSeries, createSeriesMarkers, ColorType } = await import(
        "lightweight-charts"
      );
      if (disposed) return;

      const textColor = resolvedTheme === "dark" ? "#9CA3AF" : "#374151";
      const gridColor = resolvedTheme === "dark" ? "rgba(148,163,184,0.12)" : "rgba(0,0,0,0.05)";

      const chart = createChart(container, {
        width: container.clientWidth,
        height,
        layout: {
          background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" },
          textColor,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false, timeVisible: true },
        crosshair: { mode: 0 },
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: BUY_COLOR,
        downColor: SELL_COLOR,
        borderUpColor: BUY_COLOR,
        borderDownColor: SELL_COLOR,
        wickUpColor: "#838ca1",
        wickDownColor: "#838ca1",
      });

      chartRef.current = chart;
      seriesRef.current = series;

      // Trade/indicator markers.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see chartRef above.
      const markersPlugin = createSeriesMarkers(series, []) as any;
      markersPluginRef.current = markersPlugin;

      // Trade highlight glow elements.
      if (!document.getElementById("voraui-trade-glow-styles")) {
        const style = document.createElement("style");
        style.id = "voraui-trade-glow-styles";
        style.textContent = `
          @keyframes vorauiTradeGlowRing {
            0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.9; }
            70%  { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
            100% { transform: translate(-50%,-50%) scale(0.5); opacity: 0; }
          }
          @keyframes vorauiTradeGlowDot {
            0%, 100% { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
            50%       { transform: translate(-50%,-50%) scale(1.3); opacity: 0.65; }
          }
        `;
        document.head.appendChild(style);
      }

      const glowRingEl = document.createElement("div");
      Object.assign(glowRingEl.style, {
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
      container.appendChild(glowRingEl);
      glowRingRef.current = glowRingEl;

      const glowRing2El = document.createElement("div");
      Object.assign(glowRing2El.style, {
        position: "absolute",
        pointerEvents: "none",
        zIndex: "44",
        display: "none",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "2px solid transparent",
        animation: "vorauiTradeGlowRing 1.6s ease-out 0.8s infinite",
      } as Partial<CSSStyleDeclaration>);
      container.appendChild(glowRing2El);
      glowRing2Ref.current = glowRing2El;

      const glowDotEl = document.createElement("div");
      Object.assign(glowDotEl.style, {
        position: "absolute",
        pointerEvents: "none",
        zIndex: "45",
        display: "none",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        animation: "vorauiTradeGlowDot 1.2s ease-in-out infinite",
      } as Partial<CSSStyleDeclaration>);
      container.appendChild(glowDotEl);
      glowDotRef.current = glowDotEl;

      const updateGlowPosition = () => {
        const ht = highlightedTradeRef.current;
        const hide = () => {
          glowRingEl.style.display = "none";
          glowRing2El.style.display = "none";
          glowDotEl.style.display = "none";
        };

        if (!ht || !chartRef.current || !seriesRef.current) {
          hide();
          return;
        }

        const normalizedSec = ht.timestampMs > 9_999_999_999 ? Math.floor(ht.timestampMs / 1000) : ht.timestampMs;

        // Find the closest candle to get the bar's actual low/high.
        const currentCandles = candlesRef.current;
        const closest = currentCandles.length
          ? currentCandles.reduce((best, c) =>
              Math.abs(c.time - normalizedSec) < Math.abs(best.time - normalizedSec) ? c : best,
            currentCandles[0])
          : null;

        // Place glow near the marker: belowBar for BUY (low), aboveBar for SELL (high).
        const glowPrice = ht.side === "BUY" ? (closest?.low ?? ht.price) : (closest?.high ?? ht.price);

        const isDailyPlus = ["1d", "1w", "1M"].includes(timeframeRef.current);
        const chartTime = isDailyPlus
          ? new Date(normalizedSec * 1000).toISOString().split("T")[0]
          : normalizedSec;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- chartTime is a number or business-day string depending on timeframe; see chartRef above.
        const x = chartRef.current.timeScale().timeToCoordinate(chartTime as any);
        const y = seriesRef.current.priceToCoordinate(glowPrice);

        if (x == null || y == null) {
          hide();
          return;
        }

        const color = ht.side === "BUY" ? BUY_COLOR : SELL_COLOR;
        const shadow =
          ht.side === "BUY" ? "0 0 8px 3px rgba(0,193,118,0.6)" : "0 0 8px 3px rgba(207,48,74,0.6)";

        const posStyle = { left: `${x}px`, top: `${y}px`, display: "block" };

        Object.assign(glowRingEl.style, posStyle);
        glowRingEl.style.borderColor = color;
        glowRingEl.style.boxShadow = shadow;

        Object.assign(glowRing2El.style, posStyle);
        glowRing2El.style.borderColor = color;
        glowRing2El.style.boxShadow = shadow;

        Object.assign(glowDotEl.style, posStyle);
        glowDotEl.style.background = color;
        glowDotEl.style.boxShadow = shadow;
      };

      updateGlowRef.current = updateGlowPosition;
      chart.timeScale().subscribeVisibleLogicalRangeChange(updateGlowPosition);

      // Tooltip element.
      const tip = document.createElement("div");
      Object.assign(tip.style, {
        position: "absolute",
        pointerEvents: "none",
        zIndex: "50",
        padding: "12px",
        borderRadius: "12px",
        background: "rgba(17,17,20,0.95)",
        color: "#fff",
        fontSize: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        transform: "translate(-50%, -110%)",
        display: "none",
        minWidth: "160px",
        transition: "opacity 0.2s ease-in-out",
      } as unknown as CSSStyleDeclaration);
      container.appendChild(tip);
      tooltipRef.current = tip;

      chart.timeScale().fitContent();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- logical range param shape from the dynamically-imported chart instance; see chartRef above.
      chart.timeScale().subscribeVisibleLogicalRangeChange(async (range: any) => {
        if (!range || isLoadingMoreRef.current || !oldestTimestampRef.current || !hasMoreHistoryRef.current)
          return;

        if (range.from < 50) {
          isLoadingMoreRef.current = true;
          try {
            await fetchMoreRef.current(oldestTimestampRef.current);
          } finally {
            isLoadingMoreRef.current = false;
          }
        }
      });

      // Lightweight Charts returns param.time as a number for intraday charts
      // but as a BusinessDay object or string for daily+ charts. Normalize to
      // unix seconds so we can compare against alignedTime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- t is a lightweight-charts Time (number, string, or BusinessDay object); see chartRef above.
      const normalizeParamTime = (t: any): number | undefined => {
        if (t == null) return undefined;
        if (typeof t === "number") return t;
        if (typeof t === "string") return Math.floor(new Date(t + "T00:00:00Z").getTime() / 1000);
        if (typeof t === "object" && "year" in t) return Math.floor(Date.UTC(t.year, t.month - 1, t.day) / 1000);
        return undefined;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- crosshair/click event param from the dynamically-imported chart instance; see chartRef above.
      const updateTipFromEvent = (param: any) => {
        const el = tooltipRef.current;
        if (!el) return;
        const pt = param?.point;
        const t = normalizeParamTime(param?.time);

        if (!pt || t == null) {
          if (!isStickyRef.current) el.style.display = "none";
          return;
        }

        const aligned = alignSignalsToBars(tradesRef.current, candlesRef.current, timeframeRef.current);
        const found = aligned.filter((s) => s.alignedTime === t);
        if (found.length > 0) {
          updateTooltipContent(el, found, pt);
        } else {
          if (!isStickyRef.current) el.style.display = "none";
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see updateTipFromEvent above.
      const crosshairHandler = (param: any) => {
        const el = tooltipRef.current;
        if (!el || isStickyRef.current) return;
        const pt = param?.point;
        const t = normalizeParamTime(param?.time);

        if (!pt || t == null) {
          el.style.display = "none";
          return;
        }

        const aligned = alignSignalsToBars(tradesRef.current, candlesRef.current, timeframeRef.current);
        const found = aligned.filter((s) => s.alignedTime === t);
        if (found.length > 0) {
          updateTooltipContent(el, found, pt);
        } else {
          el.style.display = "none";
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see updateTipFromEvent above.
      const clickHandler = (param: any) => {
        if (!param?.point || !showDetailsRef.current) return;
        const t = normalizeParamTime(param?.time);
        if (t == null) {
          isStickyRef.current = false;
          updateTipFromEvent(param);
          return;
        }

        const aligned = alignSignalsToBars(tradesRef.current, candlesRef.current, timeframeRef.current);
        const hasSig = aligned.some((s) => s.alignedTime === t);
        if (hasSig) {
          isStickyRef.current = !isStickyRef.current;
        } else {
          isStickyRef.current = false;
        }
        updateTipFromEvent(param);
      };

      chart.subscribeCrosshairMove(crosshairHandler);
      chart.subscribeClick(clickHandler);
    };

    if (containerRef.current) {
      ro = new ResizeObserver((entries) => {
        const { width, height: rectHeight } = entries[0].contentRect;
        if (width > 0 && rectHeight > 0 && !chartInitialized) {
          chartInitialized = true;
          initChart(containerRef.current!);
        } else if (width > 0 && chartInitialized && chartRef.current) {
          chartRef.current.applyOptions({ width });
        }
      });
      ro.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      if (ro) ro.disconnect();
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      if (glowRingRef.current) {
        glowRingRef.current.remove();
        glowRingRef.current = null;
      }
      if (glowRing2Ref.current) {
        glowRing2Ref.current.remove();
        glowRing2Ref.current = null;
      }
      if (glowDotRef.current) {
        glowDotRef.current.remove();
        glowDotRef.current = null;
      }
      updateGlowRef.current = null;
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
      markersPluginRef.current = null;
    };
    // Only reinitialize if height changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Update chart data.
  React.useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    const key = `${symbol}-${timeframe}`;
    const keyChanged = lastKeyRef.current !== key;
    lastKeyRef.current = key;

    if (effectiveCandles.length === 0) {
      if (keyChanged) {
        seriesRef.current.setData([]);
        chartRef.current?.timeScale().resetTimeScale();
        isAutoFitDoneRef.current = false;
        lastCandlesLengthRef.current = 0;
        lastClosedTimeRef.current = 0;
        isResettingRef.current = true;
      }
      return;
    }

    const sanitized = sanitizeCandles(effectiveCandles);
    if (sanitized.length === 0) {
      return;
    }

    // Only use setData for full resets or history injection.
    // Streaming updates go through handleNewCandle -> series.update().
    const numCandlesAdded = sanitized.length - lastCandlesLengthRef.current;
    const isMajorChange = keyChanged || Math.abs(numCandlesAdded) > 2;

    if (isMajorChange) {
      isResettingRef.current = false;
      const timeScale = chartRef.current?.timeScale();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- logical range shape from the dynamically-imported chart instance; see chartRef above.
      let prevLogicalRange: any = null;

      if (timeScale && isAutoFitDoneRef.current) {
        prevLogicalRange = timeScale.getVisibleLogicalRange();
      }

      const isDailyOrHigher = ["1d", "1w", "1M"].includes(timeframe);
      const mapped = sanitized.map((c) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- t is a number or business-day string depending on timeframe; see chartRef above.
        let t: any = c.time;
        if (isDailyOrHigher) {
          t = new Date(c.time * 1000).toISOString().split("T")[0];
        }
        return { time: t, open: c.open, high: c.high, low: c.low, close: c.close };
      });
      const deduped = mapped.filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time);
      seriesRef.current.setData(deduped);

      if (!isAutoFitDoneRef.current) {
        chartRef.current.timeScale().fitContent();
        isAutoFitDoneRef.current = true;
      }
      if (prevLogicalRange && isLoadingMoreRef.current) {
        let shift = 0;
        if (oldestTimestampRef.current) {
          const prependedCandlesCount = sanitized.findIndex((c) => c.time === oldestTimestampRef.current);
          if (prependedCandlesCount > 0) {
            shift = prependedCandlesCount;
          }
        }

        if (prevLogicalRange.from !== null && prevLogicalRange.to !== null) {
          chartRef.current.timeScale().setVisibleLogicalRange({
            from: prevLogicalRange.from + shift,
            to: prevLogicalRange.to + shift,
          });
        }
      }
    }

    lastCandlesLengthRef.current = sanitized.length;

    if (sanitized.length > 0) {
      oldestTimestampRef.current = sanitized[0].time;
    }
  }, [effectiveCandles, symbol, timeframe]);

  // Update markers.
  React.useEffect(() => {
    if (!markersPluginRef.current) return;
    const aligned = alignSignalsToBars(trades, effectiveCandles, timeframe);
    const markers = buildSeriesMarkers(aligned);
    markersPluginRef.current.setMarkers(markers);
  }, [effectiveCandles, trades, timeframe]);

  // Merge live candles from polling.
  const handleNewCandle = React.useCallback(
    (candle: OhlcvCandle) => {
      if (!seriesRef.current || !chartRef.current) return;
      if (isResettingRef.current) return;

      // With a static prop-supplied dataset, never inject live candles:
      // mixing live "now" candles into historical data produces a stray
      // disconnected cluster on the chart.
      if (hasOverrideCandlesRef.current) return;

      if (!isValidCandle(candle)) return;

      const normalizedTime =
        typeof candle.time === "number" && candle.time > 9999999999
          ? Math.floor(candle.time / 1000)
          : Number(candle.time);

      if (!Number.isFinite(normalizedTime) || normalizedTime <= 0) return;

      const isForming = candle.isForming === true;

      // If it's a closed bar we already saw, skip.
      if (!isForming && normalizedTime <= lastClosedTimeRef.current) {
        return;
      }

      const currentTimeframe = timeframeRef.current;
      const isDailyOrHigher = ["1d", "1w", "1M"].includes(currentTimeframe);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- finalTime is a number or business-day string depending on timeframe; see chartRef above.
      let finalTime: any = normalizedTime;

      if (isDailyOrHigher) {
        finalTime = new Date(normalizedTime * 1000).toISOString().split("T")[0];
      }

      try {
        seriesRef.current.update({
          time: finalTime,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      } catch {
        // Lightweight Charts throws when updating with a time older than the
        // earliest bar (e.g. during timeframe transitions).
        return;
      }

      if (!isForming) {
        lastClosedTimeRef.current = normalizedTime;
      }

      setCandles((prev) => {
        if (prev.length === 0) return [candle];
        const last = prev[prev.length - 1];
        const lastTime = Number(last.time);

        if (normalizedTime === lastTime) {
          const copy = [...prev];
          copy[copy.length - 1] = candle;
          return copy;
        } else if (normalizedTime > lastTime) {
          return [...prev, candle];
        }
        return prev;
      });
    },
    [setCandles],
  );

  useLatestCandlePolling(symbol, timeframe, live && candlesProp === undefined, handleNewCandle);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-card", className)}>
      {/* Loading overlay */}
      {loading && effectiveCandles.length === 0 && (
        <div
          role="status"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm"
        >
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-violet-600" aria-hidden="true" />
          <p className="text-sm font-medium text-muted-foreground" aria-hidden="true">
            Loading market data...
          </p>
          <span className="sr-only">Loading market data</span>
        </div>
      )}

      {/* Error state */}
      {error && effectiveCandles.length === 0 && !loading && (
        <div role="alert" className="absolute inset-0 z-50 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Market data is unavailable ({error}).</p>
        </div>
      )}

      {/* No more historical data notification */}
      {showNoMoreData && (
        <div className="absolute left-3 top-3 z-40 duration-300 animate-in fade-in slide-in-from-left-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur-sm">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
              No more historical data
            </span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative w-full" style={{ height }} />
    </div>
  );
});

TradingChart.displayName = "TradingChart";

export { TradingChart };
export default TradingChart;
