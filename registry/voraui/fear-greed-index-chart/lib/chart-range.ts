export type Preset = "30D" | "1Y" | "ALL";

/** Days shown by each fixed-length preset; "ALL" fits the whole history. */
export const PRESET_DAYS: Record<Exclude<Preset, "ALL">, number> = { "30D": 30, "1Y": 365 };
export const DAY_SECONDS = 86_400;

// Fits "Extreme Greed" at 11px plus the inset on both sides.
const LABEL_GUTTER = 92;
/** Plot width from which the band labels get their own column; narrower plots hide them. */
export const LABEL_GUTTER_MIN_PLOT_WIDTH = 480;

/** Right offset in pixels reserved for the band labels; 0 means the labels are hidden. */
export function labelGutterPixels(plotWidth: number): number {
  return plotWidth >= LABEL_GUTTER_MIN_PLOT_WIDTH ? LABEL_GUTTER : 0;
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

/** Number of distinct times across all series: the bars the time scale actually lays out. */
export function distinctTimeCount(series: ReadonlyArray<ReadonlyArray<{ time: number }>>): number {
  const times = new Set<number>();
  for (const points of series) for (const p of points) times.add(p.time);
  return times.size;
}

type LogicalSpan = { from: number; to: number };

// Half a bar either side of the first and last bar centers.
const FIRST_BAR_EDGE = -0.5;
// Overshoot the chart produces on its own edge corrections; clamping it would loop.
const CLAMP_TOLERANCE = 0.5;

/**
 * Keeps a requested logical range between the first bar and the reserved padding past the last
 * bar, preserving its span; a span wider than everything fits everything.
 */
export function clampLogicalRange(
  range: LogicalSpan,
  barCount: number,
  rightPaddingBars: number,
): LogicalSpan {
  if (barCount <= 0) return range;
  const maxTo = barCount - 1 + rightPaddingBars;
  const span = range.to - range.from;
  if (span > maxTo - FIRST_BAR_EDGE + 2 * CLAMP_TOLERANCE) return { from: FIRST_BAR_EDGE, to: maxTo };
  if (range.to > maxTo + CLAMP_TOLERANCE) return { from: maxTo - span, to: maxTo };
  if (range.from < FIRST_BAR_EDGE - CLAMP_TOLERANCE) {
    return { from: FIRST_BAR_EDGE, to: FIRST_BAR_EDGE + span };
  }
  return range;
}
