import type { ChartOptions, ColorType, DeepPartial } from "lightweight-charts";
import { BUY_COLOR, SELL_COLOR } from "./markers";

const WICK_COLOR = "#838ca1";

export const CANDLE_SERIES_OPTIONS = {
  upColor: BUY_COLOR,
  downColor: SELL_COLOR,
  borderUpColor: BUY_COLOR,
  borderDownColor: SELL_COLOR,
  wickUpColor: WICK_COLOR,
  wickDownColor: WICK_COLOR,
};

/** Theme-dependent chart options, applied at creation and on theme changes. */
export function getThemeOptions(resolvedTheme: string | undefined): DeepPartial<ChartOptions> {
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(148,163,184,0.12)" : "rgba(0,0,0,0.05)";

  return {
    layout: {
      // "solid" = ColorType.Solid; importing the enum would eagerly bundle the library.
      background: { type: "solid" as ColorType.Solid, color: "rgba(0,0,0,0)" },
      textColor: isDark ? "#9CA3AF" : "#374151",
    },
    grid: {
      vertLines: { color: gridColor },
      horzLines: { color: gridColor },
    },
  };
}

/** Full options for createChart. */
export function getChartOptions(
  resolvedTheme: string | undefined,
  height: number,
): DeepPartial<ChartOptions> {
  return {
    height,
    ...getThemeOptions(resolvedTheme),
    rightPriceScale: { borderVisible: false },
    timeScale: {
      borderVisible: false,
      timeVisible: true,
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    crosshair: { mode: 0 },
  };
}
