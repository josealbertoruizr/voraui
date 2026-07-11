import type { OhlcvCandle, TradeSignal } from "./trading-chart-types";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- crosshair event param from the dynamically-imported chart instance.
  onCrosshairMove: (param: any) => void;
  hide: () => void;
  dispose: () => void;
}

const STYLE_ID = "voraui-tooltip-styles";

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
        from { opacity: 0; transform: translate(-50%, -104%) scale(0.96); }
        to   { opacity: 1; transform: translate(-50%, -110%) scale(1); }
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
    transform: "translate(-50%, -110%)",
    display: "none",
    minWidth: "160px",
    transition: "opacity 0.2s ease-in-out",
  } as unknown as CSSStyleDeclaration);
  container.appendChild(el);

  const hide = () => {
    el.style.display = "none";
  };

  const show = (list: AlignedSignal[], pt: { x: number; y: number }) => {
    const wasHidden = el.style.display !== "block";
    el.style.left = `${pt.x}px`;
    el.style.top = `${pt.y}px`;
    el.style.display = "block";

    // Play the entrance only on the hidden -> shown transition, not on every
    // crosshair move while the tooltip is already up (that would flicker).
    if (wasHidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Restart the animation in case a previous run left the same value.
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "vorauiTooltipIn 0.16s ease-out";
    }

    el.innerHTML = renderTooltipHtml(list);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see SignalTooltip.onCrosshairMove.
  const onCrosshairMove = (param: any) => {
    if (!isEnabled()) {
      hide();
      return;
    }
    const pt = param?.point;
    const t = normalizeParamTime(param?.time);
    if (!pt || t == null) {
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
