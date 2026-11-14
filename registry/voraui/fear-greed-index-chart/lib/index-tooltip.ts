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
  if (!Number.isFinite(n) || n === 0) return "-";
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

/** Floating tooltip for the index chart; hidden on days with no index value. */
export function createIndexTooltip(
  container: HTMLElement,
  getSeries: () => IndexTooltipSeries,
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
    if (
      !index ||
      !param.point ||
      !param.time ||
      param.point.x < 0 ||
      param.point.y < 0 ||
      param.point.x > container.clientWidth ||
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
    const ttWidth = tooltip.offsetWidth || 140;
    const ttHeight = tooltip.offsetHeight || 60;
    let left = param.point.x + 12;
    let top = param.point.y - ttHeight - 12;
    if (left + ttWidth > container.clientWidth - 4) {
      left = param.point.x - ttWidth - 12;
    }
    if (top < 4) top = param.point.y + 12;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  return {
    onCrosshairMove,
    dispose: () => tooltip.remove(),
  };
}
