export interface FearGreedBand {
  key: string;
  label: string;
  min: number;
  max: number;
  color: string;
}

/** Boundaries mirror alternative.me's own value_classification thresholds,
 *  so the arc's coloring lines up with the label the bundled fetcher returns. */
export const DEFAULT_FEAR_GREED_BANDS: FearGreedBand[] = [
  { key: "extreme-fear", label: "Extreme Fear", min: 0, max: 24, color: "#c0392b" },
  { key: "fear", label: "Fear", min: 25, max: 44, color: "#e0672b" },
  { key: "neutral", label: "Neutral", min: 45, max: 55, color: "#f0c929" },
  { key: "greed", label: "Greed", min: 56, max: 75, color: "#4caf50" },
  { key: "extreme-greed", label: "Extreme Greed", min: 76, max: 100, color: "#2e7d32" },
];

export const GAUGE_CENTER_X = 130;
export const GAUGE_CENTER_Y = 130;

/** Angle in degrees (standard math convention, 0 deg = +x axis) for a 0-100
 *  gauge value along the top semicircle: 180 deg at value 0 (left) down to
 *  0 deg at value 100 (right). */
export function angleForValue(value: number): number {
  const clamped = Math.min(Math.max(value, 0), 100);
  return 180 - (clamped / 100) * 180;
}

/** Point on the gauge's circle at the given radius for a 0-100 value.
 *  Coordinates are rounded to 4 decimal places: Math.cos/Math.sin can differ
 *  in their last bit between the server's and browser's JS engine builds,
 *  which otherwise surfaces as a React hydration mismatch on these SVG
 *  attributes. */
export function arcPoint(radius: number, value: number): { x: number; y: number } {
  const rad = (angleForValue(value) * Math.PI) / 180;
  return {
    x: Math.round((GAUGE_CENTER_X + radius * Math.cos(rad)) * 10000) / 10000,
    y: Math.round((GAUGE_CENTER_Y - radius * Math.sin(rad)) * 10000) / 10000,
  };
}

/** SVG arc path `d` for the segment between two values, drawn along the top
 *  semicircle (sweeping left to right). */
export function describeArc(radius: number, fromValue: number, toValue: number): string {
  const start = arcPoint(radius, fromValue);
  const end = arcPoint(radius, toValue);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

/** SVG path `d` for a filled annular wedge (a pie-slice ring segment) between
 *  two radii and two values, for the "wedges" variant's zone sectors. */
export function describeWedge(
  outerRadius: number,
  innerRadius: number,
  fromValue: number,
  toValue: number,
): string {
  const outerStart = arcPoint(outerRadius, fromValue);
  const outerEnd = arcPoint(outerRadius, toValue);
  const innerEnd = arcPoint(innerRadius, toValue);
  const innerStart = arcPoint(innerRadius, fromValue);
  return (
    `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y} ` +
    `L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y} Z`
  );
}

/** Which band a 0-100 value falls into, for the "wedges" variant's
 *  active-zone highlight. Clamps out-of-range values into the nearest edge
 *  band instead of returning undefined. */
export function findFearGreedBand(
  value: number,
  bands: FearGreedBand[] = DEFAULT_FEAR_GREED_BANDS,
): FearGreedBand {
  const clamped = Math.min(Math.max(value, 0), 100);
  return bands.find((band) => clamped >= band.min && clamped <= band.max) ?? bands[bands.length - 1];
}

/** Remaps a 0-100 value onto a dial where every band covers an equal angular
 *  share, the way CNN's Fear & Greed gauge draws its zones: narrow bands like
 *  neutral (45-55) get the same wedge width as wide ones, so every zone label
 *  fits inside its wedge. The "wedges" variant runs its needle, dots, and
 *  scale numbers through this same mapping, keeping the needle inside the
 *  highlighted wedge (which a linear needle over equal wedges would not). */
export function equalizedValue(
  value: number,
  bands: FearGreedBand[] = DEFAULT_FEAR_GREED_BANDS,
): number {
  const clamped = Math.min(Math.max(value, 0), 100);
  const band = findFearGreedBand(clamped, bands);
  const index = bands.indexOf(band);
  const share = 100 / bands.length;
  return index * share + ((clamped - band.min) / (band.max - band.min)) * share;
}

export interface GradientStop {
  value: number;
  color: string;
}

/** Evenly-spaced version of DEFAULT_FEAR_GREED_BANDS's 5 colors, used to
 *  interpolate a smooth per-tick gradient for the "ticks" variant. */
export const GRADIENT_STOPS: GradientStop[] = [
  { value: 0, color: "#c0392b" },
  { value: 25, color: "#e0672b" },
  { value: 50, color: "#f0c929" },
  { value: 75, color: "#4caf50" },
  { value: 100, color: "#2e7d32" },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Interpolated hex color for a 0-100 value, walking linearly between
 *  whichever pair of GRADIENT_STOPS the value falls between. */
export function colorForValue(value: number, stops: GradientStop[] = GRADIENT_STOPS): string {
  const clamped = Math.min(Math.max(value, 0), 100);
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    if (clamped >= from.value && clamped <= to.value) {
      const t = (clamped - from.value) / (to.value - from.value);
      const [r1, g1, b1] = hexToRgb(from.color);
      const [r2, g2, b2] = hexToRgb(to.color);
      return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
    }
  }
  return stops[stops.length - 1].color;
}
