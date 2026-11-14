export interface FearGreedBand {
  key: string;
  label: string;
  min: number;
  max: number;
  color: string;
}

export interface FearGreedPoint {
  /** Unix seconds. */
  time: number;
  /** Index value, 0-100. */
  value: number;
}

export interface BtcDailyPoint {
  /** Unix seconds. */
  time: number;
  price: number;
  volume: number;
}

/** Sentiment bands, ascending, mirroring the alternative.me thresholds. */
export const FEAR_GREED_BANDS: FearGreedBand[] = [
  { key: "extreme-fear", label: "Extreme Fear", min: 0, max: 24, color: "#c0392b" },
  { key: "fear", label: "Fear", min: 25, max: 44, color: "#e0672b" },
  { key: "neutral", label: "Neutral", min: 45, max: 55, color: "#f0c929" },
  { key: "greed", label: "Greed", min: 56, max: 75, color: "#4caf50" },
  { key: "extreme-greed", label: "Extreme Greed", min: 76, max: 100, color: "#2e7d32" },
];

/** Returns the band for a value, rounding to an integer and clamping to 0-100. */
export function findFearGreedBand(value: number): FearGreedBand {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    FEAR_GREED_BANDS.find((band) => v >= band.min && v <= band.max) ??
    FEAR_GREED_BANDS[0]
  );
}

/** Sorts ascending by time, keeps the last duplicate, and drops non-positive or non-finite times. */
export function normalizeByTime<T extends { time: number }>(points: readonly T[]): T[] {
  const byTime = new Map<number, T>();
  for (const point of points) {
    if (Number.isFinite(point.time) && point.time > 0) byTime.set(point.time, point);
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

/** Maps index points to line data colored by band, dropping non-finite values. */
export function toIndexLineData(
  points: FearGreedPoint[],
): { time: number; value: number; color: string }[] {
  return points
    .filter((point) => Number.isFinite(point.value))
    .map((point) => ({
      time: point.time,
      value: point.value,
      color: findFearGreedBand(point.value).color,
    }));
}

/** Keeps points whose time is within the inclusive range. */
export function clipToRange<T extends { time: number }>(
  points: T[],
  from: number,
  to: number,
): T[] {
  return points.filter((point) => point.time >= from && point.time <= to);
}
