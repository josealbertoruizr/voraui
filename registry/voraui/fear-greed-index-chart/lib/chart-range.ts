export type Preset = "30D" | "1Y" | "ALL";

/** Days shown by each fixed-length preset; "ALL" fits the whole history. */
export const PRESET_DAYS: Record<Exclude<Preset, "ALL">, number> = { "30D": 30, "1Y": 365 };
export const DAY_SECONDS = 86_400;

// Fits "Extreme Greed" at 11px plus the inset on both sides.
const LABEL_GUTTER = 92;
const NARROW_RIGHT_OFFSET = 8;
/** Chart width from which the band labels get their own column right of the latest day. */
export const LABEL_GUTTER_MIN_WIDTH = 480;

/** Right offset in pixels for the time scale, so the latest stretch stays clear of the labels. */
export function labelGutterPixels(chartWidth: number): number {
  return chartWidth >= LABEL_GUTTER_MIN_WIDTH ? LABEL_GUTTER : NARROW_RIGHT_OFFSET;
}

/** Logical range showing bars `from..to` with the gutter kept free right of `to`. */
export function presetLogicalRange(
  from: number,
  to: number,
  plotWidth: number,
  gutter: number,
): { from: number; to: number } {
  const usable = plotWidth - gutter;
  if (gutter <= 0 || usable <= 0 || to <= from) return { from, to };
  return { from, to: to + (gutter * (to - from)) / usable };
}

// lightweight-charts' default minBarSpacing.
const DEFAULT_MIN_BAR_SPACING = 0.5;

/** Smallest bar spacing at which all `bars` plus the gutter still fit, so zoom-out stops at "all". */
export function minBarSpacingFor(plotWidth: number, gutter: number, bars: number): number {
  const usable = plotWidth - gutter;
  if (bars <= 0 || usable <= 0) return DEFAULT_MIN_BAR_SPACING;
  return usable / bars;
}
