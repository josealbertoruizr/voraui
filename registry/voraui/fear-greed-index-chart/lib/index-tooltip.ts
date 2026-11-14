import type { ISeriesApi, MouseEventParams, Time } from "lightweight-charts";
import { findFearGreedBand, type FearGreedBand } from "./fear-greed-bands";

/** Compact USD for tooltip rows, e.g. "$64.00K". */
export function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

/** Compact USD for axis ticks: drops trailing ".00" so the price scale stays narrow. */
export function compactUsdTick(n: number): string {
  if (!Number.isFinite(n)) return "-";
  if (n === 0) return "$0";
  const trim = (v: number) => v.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 1e9) return `$${trim(n / 1e9)}B`;
  if (n >= 1e6) return `$${trim(n / 1e6)}M`;
  if (n >= 1e3) return `$${trim(n / 1e3)}K`;
  if (n >= 1) return `$${trim(n)}`;
  return `$${n.toFixed(4).replace(/0+$/, "")}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Pure renderer for the tooltip body; exported for tests. */
export function renderIndexTooltipHtml(
  dateStr: string,
  value: number,
  band: FearGreedBand,
  btc?: { price?: number; volume?: number },
): string {
  const row = (label: string, text: string) =>
    `<div class="mt-1 flex items-center justify-between gap-4">
       <span class="text-zinc-400">${label}</span>
       <span class="text-zinc-200 tabular-nums">${text}</span>
     </div>`;
  return `
    <div class="text-zinc-400">${escapeHtml(dateStr)}</div>
    <div class="mt-1 flex items-center gap-1.5">
      <span class="h-2 w-2 shrink-0 rounded-full" style="background-color:${band.color}"></span>
      <span class="font-semibold text-white tabular-nums">${Math.round(value)}</span>
      <span class="text-[11px] text-zinc-300">${escapeHtml(band.label)}</span>
    </div>
    ${btc?.price !== undefined ? row("BTC", compactUsd(btc.price)) : ""}
    ${btc?.volume !== undefined ? row("Vol", compactUsd(btc.volume)) : ""}
  `;
}

const TOOLTIP_OFFSET = 12;
const TOOLTIP_EDGE_INSET = 4;

interface TooltipBox {
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Places the tooltip right of and above a pane-relative cursor, in container coordinates,
 * flipping left or below at the edges and never leaving the container.
 */
export function getIndexTooltipPosition(
  point: { x: number; y: number },
  paneLeft: number,
  tooltip: TooltipBox,
  container: TooltipBox,
): { left: number; top: number } {
  const x = paneLeft + point.x;
  let left = x + TOOLTIP_OFFSET;
  if (left + tooltip.width > container.width - TOOLTIP_EDGE_INSET) {
    left = x - tooltip.width - TOOLTIP_OFFSET;
  }
  let top = point.y - tooltip.height - TOOLTIP_OFFSET;
  if (top < TOOLTIP_EDGE_INSET) top = point.y + TOOLTIP_OFFSET;
  return {
    left: clamp(left, TOOLTIP_EDGE_INSET, container.width - tooltip.width - TOOLTIP_EDGE_INSET),
    top: clamp(top, TOOLTIP_EDGE_INSET, container.height - tooltip.height - TOOLTIP_EDGE_INSET),
  };
}

export interface IndexTooltipSeries {
  index: ISeriesApi<"Line", Time> | null;
  price: ISeriesApi<"Line", Time> | null;
  volume: ISeriesApi<"Histogram", Time> | null;
}

export interface IndexTooltip {
  /** Pass to chart.subscribeCrosshairMove. */
  onCrosshairMove: (param: MouseEventParams<Time>) => void;
  dispose: () => void;
}

/**
 * Floating tooltip for the index chart; hidden on days with no index value.
 * `getPaneLeft` returns the plot pane's left offset in the container (the left scale width).
 */
export function createIndexTooltip(
  container: HTMLElement,
  getSeries: () => IndexTooltipSeries,
  getPaneLeft: () => number,
): IndexTooltip {
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.zIndex = "30";
  tooltip.style.pointerEvents = "none";
  tooltip.style.display = "none";
  tooltip.className =
    "rounded-lg border border-zinc-800 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm";
  container.appendChild(tooltip);

  const hide = () => {
    tooltip.style.display = "none";
  };

  const valueAt = (
    series: ISeriesApi<"Line", Time> | ISeriesApi<"Histogram", Time> | null,
    param: MouseEventParams<Time>,
  ): number | undefined => {
    if (!series) return undefined;
    const data = param.seriesData.get(series) as { value?: number } | undefined;
    return typeof data?.value === "number" && Number.isFinite(data.value)
      ? data.value
      : undefined;
  };

  const onCrosshairMove = (param: MouseEventParams<Time>) => {
    const { index, price, volume } = getSeries();
    const paneLeft = getPaneLeft();
    if (
      !index ||
      !param.point ||
      !param.time ||
      param.point.x < 0 ||
      param.point.y < 0 ||
      paneLeft + param.point.x > container.clientWidth ||
      param.point.y > container.clientHeight
    ) {
      hide();
      return;
    }
    const value = valueAt(index, param);
    const ts = typeof param.time === "number" ? param.time * 1000 : NaN;
    if (value === undefined || !Number.isFinite(ts)) {
      hide();
      return;
    }

    const dateStr = new Date(ts).toISOString().slice(0, 10);
    tooltip.innerHTML = renderIndexTooltipHtml(dateStr, value, findFearGreedBand(value), {
      price: valueAt(price, param),
      volume: valueAt(volume, param),
    });

    tooltip.style.display = "block";
    const { left, top } = getIndexTooltipPosition(
      param.point,
      paneLeft,
      { width: tooltip.offsetWidth || 140, height: tooltip.offsetHeight || 60 },
      { width: container.clientWidth, height: container.clientHeight },
    );
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  return {
    onCrosshairMove,
    dispose: () => tooltip.remove(),
  };
}
