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

/** Left price scale margins: the line's low sits clear of the zone floor, or above the volume bars. */
export function priceScaleMargins(withVolume: boolean): { top: number; bottom: number } {
  return { top: SCALE_MARGIN, bottom: withVolume ? 0.26 : 0.12 };
}
// Fits half-step ticks like "$112.5K", so the plot keeps its left edge across presets.
export const PRICE_SCALE_MIN_WIDTH = 68;
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
      // The library's license then asks for a TradingView credit with a link elsewhere in the app.
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: palette.grid },
      horzLines: { color: palette.grid },
    },
  };
}

/** Full options for createChart; `fontFamily` is the host app's font, for the axis labels. */
export function chartOptions(
  palette: ChartPalette,
  width: number,
  height: number,
  fontFamily?: string,
): DeepPartial<ChartOptions> {
  const theme = themeOptions(palette);
  return {
    width,
    height,
    autoSize: false,
    ...theme,
    layout: fontFamily ? { ...theme.layout, fontFamily } : theme.layout,
    rightPriceScale: {
      borderVisible: false,
      scaleMargins: { top: SCALE_MARGIN, bottom: SCALE_MARGIN },
    },
    leftPriceScale: {
      visible: false,
      // 0 = PriceScaleMode.Normal.
      mode: 0 as PriceScaleMode.Normal,
      borderVisible: false,
      scaleMargins: priceScaleMargins(false),
    },
    timeScale: {
      borderVisible: false,
      timeVisible: false,
      secondsVisible: false,
      // The label column is reserved once the plot width is known.
      rightOffsetPixels: 0,
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

// Index points within which an axis tick would sit half under the latest-value label.
const LATEST_LABEL_CLEARANCE = 5;

/** Index scale format: whole numbers, minus any tick the latest-value label would half cover. */
export function indexPriceFormat(latest: number) {
  return {
    type: "custom" as const,
    minMove: 1,
    formatter: (value: number) =>
      value !== latest && Math.abs(value - latest) < LATEST_LABEL_CLEARANCE
        ? ""
        : String(Math.round(value)),
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
