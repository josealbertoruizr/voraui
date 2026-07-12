import type { ISeriesApi, MouseEventParams, Time } from "lightweight-charts";
import { DEFAULT_RAINBOW_BANDS, findActiveBand, type RainbowBand } from "./rainbow-bands";

export function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Pure renderer for the tooltip body; exported for tests. */
export function renderRainbowTooltipHtml(
  dateStr: string,
  price: number,
  band: RainbowBand | null,
): string {
  return `
    <div class="text-zinc-400">${dateStr}</div>
    <div class="mt-1 font-semibold text-white tabular-nums">${compactUsd(price)}</div>
    ${band
      ? `<div class="mt-1.5 flex items-center gap-1.5">
           <span class="h-2 w-2 shrink-0 rounded-full" style="background-color:${band.color}"></span>
           <span class="text-[11px] text-zinc-300">${escapeHtml(band.label)}</span>
         </div>`
      : ""}
  `;
}

export interface RainbowTooltip {
  /** Pass to chart.subscribeCrosshairMove. */
  onCrosshairMove: (param: MouseEventParams<Time>) => void;
  dispose: () => void;
}

export function createRainbowTooltip(
  container: HTMLElement,
  getSeries: () => ISeriesApi<"Line", Time> | null,
): RainbowTooltip {
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

  const onCrosshairMove = (param: MouseEventParams<Time>) => {
    const series = getSeries();
    if (
      !series ||
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
    const priceData = param.seriesData.get(series) as { value: number } | undefined;
    if (!priceData) {
      hide();
      return;
    }
    const ts = typeof param.time === "number" ? param.time * 1000 : NaN;
    if (!Number.isFinite(ts)) {
      hide();
      return;
    }

    const dateStr = new Date(ts).toISOString().slice(0, 10);
    const band = findActiveBand(priceData.value, ts, DEFAULT_RAINBOW_BANDS);
    tooltip.innerHTML = renderRainbowTooltipHtml(dateStr, priceData.value, band);

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
