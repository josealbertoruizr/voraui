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
  { key: "extreme-fear", label: "Extreme Fear", min: 0, max: 24, color: "#b91c1c" },
  { key: "fear", label: "Fear", min: 25, max: 44, color: "#ea580c" },
  { key: "neutral", label: "Neutral", min: 45, max: 55, color: "#a16207" },
  { key: "greed", label: "Greed", min: 56, max: 75, color: "#65a30d" },
  { key: "extreme-greed", label: "Extreme Greed", min: 76, max: 100, color: "#15803d" },
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
