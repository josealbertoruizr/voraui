import type {
  ChartOptions,
  ColorType,
  DeepPartial,
  HistogramSeriesPartialOptions,
  LineSeriesPartialOptions,
  PriceScaleMode,
} from "lightweight-charts";
import { compactUsdTick } from "./index-tooltip";

export const VOLUME_SCALE_ID = "volume";
export const SCALE_MARGIN = 0.05;
/** Volume bars stay in the bottom ~15% and share the index zero line. */
export const VOLUME_SCALE_MARGINS = { top: 0.8, bottom: SCALE_MARGIN };
// Fits "$120K" ticks, so the reserved scale rarely changes width once prices arrive.
export const PRICE_SCALE_MIN_WIDTH = 60;
// Below this many pixels per day the index line drops to 1px so it stays readable.
export const DENSE_BAR_SPACING = 1;

export interface ChartPalette {
  text: string;
  grid: string;
  label: string;
  halo: string;
  price: string;
  volume: string;
}

export function chartPalette(theme: string | undefined): ChartPalette {
  return theme === "dark"
    ? {
        text: "#9CA3AF",
        grid: "rgba(148,163,184,0.10)",
        label: "rgba(156,163,175,0.85)",
        halo: "rgba(10,10,10,0.85)",
        price: "rgba(161,161,170,0.85)",
        volume: "rgba(161,161,170,0.22)",
      }
    : {
        text: "#52525b",
        grid: "rgba(0,0,0,0.05)",
        label: "rgba(82,82,91,0.85)",
        halo: "rgba(255,255,255,0.85)",
        price: "rgba(82,82,91,0.8)",
        volume: "rgba(82,82,91,0.16)",
      };
}

/** Theme-dependent chart options, applied at creation and on theme changes. */
export function themeOptions(palette: ChartPalette): DeepPartial<ChartOptions> {
  return {
    layout: {
      // "solid" = ColorType.Solid; importing the enum would eagerly bundle the library.
      background: { type: "solid" as ColorType.Solid, color: "rgba(0,0,0,0)" },
      textColor: palette.text,
    },
    grid: {
      vertLines: { color: palette.grid },
      horzLines: { color: palette.grid },
    },
  };
}

/** Full options for createChart. */
export function chartOptions(
  palette: ChartPalette,
  width: number,
  height: number,
  rightOffsetPixels: number,
): DeepPartial<ChartOptions> {
  return {
    width,
    height,
    autoSize: false,
    ...themeOptions(palette),
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: SCALE_MARGIN, bottom: SCALE_MARGIN },
    },
    leftPriceScale: {
      visible: false,
      // 0 = PriceScaleMode.Normal.
      mode: 0 as PriceScaleMode.Normal,
      borderVisible: false,
      scaleMargins: { top: SCALE_MARGIN, bottom: SCALE_MARGIN },
    },
    timeScale: {
      borderVisible: false,
      timeVisible: false,
      secondsVisible: false,
      rightOffsetPixels,
      barSpacing: 4,
      // No fixRightEdge: it would force the right offset, and with it the label gutter, to 0.
      fixLeftEdge: true,
      lockVisibleTimeRangeOnResize: true,
    },
    // The tooltip carries the values; a horizontal crosshair label would read past 0-100.
    crosshair: { mode: 0, horzLine: { visible: false, labelVisible: false } },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: false,
      axisDoubleClickReset: true,
    },
  };
}

export const INDEX_SERIES_OPTIONS: LineSeriesPartialOptions = {
  lineWidth: 2,
  priceScaleId: "right",
  priceLineVisible: false,
  lastValueVisible: true,
  crosshairMarkerVisible: true,
  crosshairMarkerRadius: 4,
  priceFormat: { type: "price", precision: 0, minMove: 1 },
  autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
};

export function priceSeriesOptions(palette: ChartPalette): LineSeriesPartialOptions {
  return {
    color: palette.price,
    lineWidth: 1,
    priceScaleId: "left",
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
    priceFormat: { type: "custom", formatter: compactUsdTick },
  };
}

export function volumeSeriesOptions(palette: ChartPalette): HistogramSeriesPartialOptions {
  return {
    color: palette.volume,
    priceScaleId: VOLUME_SCALE_ID,
    priceFormat: { type: "volume" },
    priceLineVisible: false,
    lastValueVisible: false,
  };
}
