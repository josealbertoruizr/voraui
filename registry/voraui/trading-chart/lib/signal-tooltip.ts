import type { MouseEventParams } from "lightweight-charts";
import type { OhlcvCandle, TradeSignal } from "../types";
import {
  alignSignalsToBars,
  BUY_COLOR,
  SELL_COLOR,
  INDICATOR_COLOR,
  type AlignedSignal,
} from "./markers";
import { normalizeParamTime } from "./chart-time";

export interface SignalTooltipDeps {
  container: HTMLElement;
  getCandles: () => OhlcvCandle[];
  getTrades: () => TradeSignal[];
  getTimeframe: () => string;
  isEnabled: () => boolean;
}

export interface SignalTooltip {
  /** Pass to chart.subscribeCrosshairMove. */
  onCrosshairMove: (param: MouseEventParams) => void;
  hide: () => void;
  dispose: () => void;
}

const STYLE_ID = "voraui-tooltip-styles";
const TOOLTIP_EDGE_INSET = 8;
const TOOLTIP_OFFSET = 12;

interface TooltipPoint {
  x: number;
  y: number;
}

interface TooltipPosition {
  left: number;
  top: number;
}

interface TooltipBox {
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** Keeps the tooltip inside the chart while preferring the familiar above-cursor placement. */
export function getSignalTooltipPosition(
  point: TooltipPoint,
  tooltip: TooltipBox,
  container: TooltipBox,
): TooltipPosition {
  const maxLeft = Math.max(TOOLTIP_EDGE_INSET, container.width - tooltip.width - TOOLTIP_EDGE_INSET);
  const maxTop = Math.max(TOOLTIP_EDGE_INSET, container.height - tooltip.height - TOOLTIP_EDGE_INSET);
  const preferredTop = point.y - tooltip.height - TOOLTIP_OFFSET;
  const belowTop = point.y + TOOLTIP_OFFSET;
  const top =
    preferredTop >= TOOLTIP_EDGE_INSET
      ? preferredTop
      : belowTop + tooltip.height <= container.height - TOOLTIP_EDGE_INSET
        ? belowTop
        : preferredTop;

  return {
    left: clamp(point.x - tooltip.width / 2, TOOLTIP_EDGE_INSET, maxLeft),
    top: clamp(top, TOOLTIP_EDGE_INSET, maxTop),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderSignalHtml(s: AlignedSignal): string {
  if (s.category === "indicator") {
    const indicatorLabel = escapeHtml(s.indicator || "Indicator");
    const indicatorValue =
      typeof s.value === "number" && Number.isFinite(s.value) ? ` (${s.value.toFixed(2)})` : "";
    const note = s.note ? `<div style="font-size:10px;opacity:0.7;">${escapeHtml(s.note)}</div>` : "";
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
  const amount = qty > 0 ? price * qty : price;
  const qtySuffix = qty > 0 ? ` (${qty} @ ${price.toLocaleString()})` : "";
  const note = s.note ? `<div style="font-size:10px;opacity:0.7;">${escapeHtml(s.note)}</div>` : "";

  return `
    <div style="display:flex;flex-direction:column;margin-top:4px;gap:1px;">
      <div style="display:flex;justify-content:space-between;gap:12px;font-size:11px;">
        <b style="color:${s.side === "BUY" ? BUY_COLOR : SELL_COLOR}">${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} usd${qtySuffix}</b>
      </div>
      ${note}
    </div>
  `;
}

/** Pure renderer for the tooltip body; exported for tests. */
export function renderTooltipHtml(list: AlignedSignal[]): string {
  const signal = list[0];
  const count = list.length;
  const indicatorSignals = list.filter((s) => s.category === "indicator");
  const tradeSignals = list.filter((s) => s.category !== "indicator");
  const buys = tradeSignals.filter((s) => s.side === "BUY");
  const sells = tradeSignals.filter((s) => s.side === "SELL");

  return `
    <div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
      <span style="font-weight:600;font-size:13px;">${new Date(signal.ts).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
      <span style="font-size:10px;opacity:0.6;background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:4px;">${count} Signals</span>
    </div>

    ${indicatorSignals.length > 0 ? `
      <div style="margin-top:6px">
        <div style="color:${INDICATOR_COLOR};font-size:10px;text-transform:uppercase;font-weight:bold;margin-bottom:2px">Indicator Signals</div>
        ${indicatorSignals.slice(0, 8).map(renderSignalHtml).join("")}
      </div>
    ` : ""}
    ${buys.length > 0 ? `
      <div style="margin-top:6px">
        <div style="color:${BUY_COLOR};font-size:10px;text-transform:uppercase;font-weight:bold;margin-bottom:2px">Buy Signals</div>
        ${buys.slice(0, 5).map(renderSignalHtml).join("")}
      </div>
    ` : ""}
    ${sells.length > 0 ? `
      <div style="margin-top:8px">
        <div style="color:${SELL_COLOR};font-size:10px;text-transform:uppercase;font-weight:bold;margin-bottom:2px">Sell Signals</div>
        ${sells.slice(0, 5).map(renderSignalHtml).join("")}
      </div>
    ` : ""}
  `;
}

export function createSignalTooltip({
  container,
  getCandles,
  getTrades,
  getTimeframe,
  isEnabled,
}: SignalTooltipDeps): SignalTooltip {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes vorauiTooltipIn {
        from { opacity: 0; transform: translateY(-4px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  const el = document.createElement("div");
  Object.assign(el.style, {
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
    boxSizing: "border-box",
    display: "none",
    minWidth: "160px",
    maxWidth: `calc(100% - ${TOOLTIP_EDGE_INSET * 2}px)`,
    maxHeight: `calc(100% - ${TOOLTIP_EDGE_INSET * 2}px)`,
    overflow: "hidden",
    transition: "opacity 0.2s ease-in-out",
  } as unknown as CSSStyleDeclaration);
  container.appendChild(el);

  const hide = () => {
    el.style.display = "none";
  };

  const show = (list: AlignedSignal[], pt: { x: number; y: number }) => {
    const wasHidden = el.style.display !== "block";
    el.innerHTML = renderTooltipHtml(list);
    el.style.display = "block";
    const position = getSignalTooltipPosition(
      pt,
      { width: el.offsetWidth || 180, height: el.offsetHeight || 80 },
      { width: container.clientWidth, height: container.clientHeight },
    );
    el.style.left = `${position.left}px`;
    el.style.top = `${position.top}px`;

    // Animate only on hidden -> shown; re-animating on every move would flicker.
    if (wasHidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "vorauiTooltipIn 0.16s ease-out";
    }
  };

  const onCrosshairMove = (param: MouseEventParams) => {
    if (!isEnabled()) {
      hide();
      return;
    }
    const pt = param.point;
    const t = normalizeParamTime(param.time);
    if (!pt || t == null) {
      hide();
      return;
    }
    if (
      pt.x < 0 ||
      pt.y < 0 ||
      pt.x > container.clientWidth ||
      pt.y > container.clientHeight
    ) {
      hide();
      return;
    }

    const aligned = alignSignalsToBars(getTrades(), getCandles(), getTimeframe());
    const found = aligned.filter((s) => s.alignedTime === t);
    if (found.length > 0) {
      show(found, pt);
    } else {
      hide();
    }
  };

  return {
    onCrosshairMove,
    hide,
    dispose: () => el.remove(),
  };
}
