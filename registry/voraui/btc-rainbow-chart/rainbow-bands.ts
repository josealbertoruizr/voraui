/**
 * RainbowBandsPrimitive
 *
 * lightweight-charts v5 series primitive that paints the BTC rainbow chart's
 * 9 log-regression band ceilings as 8 filled strips between consecutive
 * ceilings.
 *
 * The bands are computed analytically from `A · log10(days_since_genesis) + B
 * + offset`, so the server doesn't need to ship band values per row — the
 * primitive walks the visible time range, computes ceilings at a sparse set
 * of sample points, and draws a polygon per strip.
 *
 * Below the lowest band (b9) the area is left transparent — by design the
 * "Basically a Fire Sale" zone shows as a label in the legend, not as a
 * coloured floor that floods the chart.
 */

import type {
  AutoscaleInfo,
  IChartApiBase,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from "lightweight-charts";

// lightweight-charts uses `CanvasRenderingTarget2D` from the `fancy-canvas`
// package, which isn't a direct dependency of this project. Inline a
// structural subset of the type — we only need `useMediaCoordinateSpace`.
interface MediaScope {
  context: CanvasRenderingContext2D;
  mediaSize: { width: number; height: number };
}
interface CanvasRenderingTarget2D {
  useMediaCoordinateSpace<T>(fn: (scope: MediaScope) => T): T;
}

const A = 5.84;
const B = -17.01;
const BTC_GENESIS_MS = Date.UTC(2009, 0, 3);
const DAY_MS = 86_400_000;

export interface RainbowBand {
  key: string;
  label: string;
  offset: number;
  color: string;
}

// Default bands match the server's `_RAINBOW_BANDS` ordering: top → bottom
// (most expensive → cheapest).
export const DEFAULT_RAINBOW_BANDS: RainbowBand[] = [
  { key: "b1", label: "Maximum Bubble Territory", offset: 0.5, color: "#dc2626" },
  { key: "b2", label: "Sell. Seriously, SELL!", offset: 0.36, color: "#f97316" },
  { key: "b3", label: "FOMO intensifies", offset: 0.22, color: "#f59e0b" },
  { key: "b4", label: "Is this a bubble?", offset: 0.08, color: "#eab308" },
  { key: "b5", label: "HODL!", offset: -0.06, color: "#84cc16" },
  { key: "b6", label: "Still cheap", offset: -0.2, color: "#22c55e" },
  { key: "b7", label: "Accumulate", offset: -0.34, color: "#14b8a6" },
  { key: "b8", label: "BUY!", offset: -0.48, color: "#0ea5e9" },
  { key: "b9", label: "Basically a Fire Sale", offset: -0.62, color: "#2563eb" },
];

export function rainbowPriceAt(dateMs: number, offset: number): number {
  const days = Math.max((dateMs - BTC_GENESIS_MS) / DAY_MS, 1);
  return Math.pow(10, A * Math.log10(days) + B + offset);
}

/** Given a price + date, return the band the price currently sits inside.
 *  Returns null if the price is below every ceiling. */
export function findActiveBand(
  price: number,
  dateMs: number,
  bands: RainbowBand[] = DEFAULT_RAINBOW_BANDS,
): RainbowBand | null {
  // Walk top→bottom; the first ceiling crossed is the visible band.
  const sorted = [...bands].sort((a, b) => b.offset - a.offset);
  for (const band of sorted) {
    const ceiling = rainbowPriceAt(dateMs, band.offset);
    if (price >= ceiling) {
      return band;
    }
  }
  return null;
}

class RainbowBandsRenderer implements IPrimitivePaneRenderer {
  constructor(
    private chart: IChartApiBase<Time> | null,
    private series: ISeriesApi<SeriesType, Time> | null,
    private bands: RainbowBand[],
    private fillOpacity: number,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    const chart = this.chart;
    const series = this.series;
    if (!chart || !series) return;

    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      const width = mediaSize.width;
      if (width <= 0) return;

      const timeScale = chart.timeScale();

      // Sample roughly one point every 6 CSS pixels — smooth enough for
      // bands' gentle curves while staying cheap on zoom/resize.
      const STEP = 6;
      const sampleCount = Math.max(2, Math.ceil(width / STEP));

      const xs: number[] = [];
      const dates: number[] = [];
      for (let i = 0; i < sampleCount; i++) {
        const x = (i / (sampleCount - 1)) * width;
        const t = timeScale.coordinateToTime(x);
        if (t === null) continue;
        const ms = timeToMs(t);
        if (ms === null) continue;
        xs.push(x);
        dates.push(ms);
      }
      if (xs.length < 2) return;

      // Sort bands top→bottom (highest offset first).
      const sorted = [...this.bands].sort((a, b) => b.offset - a.offset);

      // Precompute ceiling y-coords for every band at every sample x.
      const ceilingYs: number[][] = sorted.map(() => new Array(xs.length).fill(NaN));
      for (let s = 0; s < xs.length; s++) {
        const dateMs = dates[s];
        for (let b = 0; b < sorted.length; b++) {
          const price = rainbowPriceAt(dateMs, sorted[b].offset);
          const y = series.priceToCoordinate(price);
          if (y !== null) ceilingYs[b][s] = y;
        }
      }

      // Paint 8 strips between consecutive ceilings. The strip between
      // sorted[i] (top) and sorted[i+1] (bottom) gets sorted[i+1]'s color —
      // visually that strip is the band immediately below sorted[i].
      ctx.save();
      ctx.globalAlpha = this.fillOpacity;
      for (let b = 0; b < sorted.length - 1; b++) {
        const topYs = ceilingYs[b];
        const bottomYs = ceilingYs[b + 1];
        ctx.fillStyle = sorted[b + 1].color;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s < xs.length; s++) {
          const y = topYs[s];
          if (!Number.isFinite(y)) continue;
          if (!started) {
            ctx.moveTo(xs[s], y);
            started = true;
          } else {
            ctx.lineTo(xs[s], y);
          }
        }
        for (let s = xs.length - 1; s >= 0; s--) {
          const y = bottomYs[s];
          if (!Number.isFinite(y)) continue;
          ctx.lineTo(xs[s], y);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  }
}

class RainbowBandsPaneView implements IPrimitivePaneView {
  constructor(private primitive: RainbowBandsPrimitive) {}

  zOrder() {
    return "bottom" as const;
  }

  renderer(): IPrimitivePaneRenderer | null {
    return new RainbowBandsRenderer(
      this.primitive.chart,
      this.primitive.series,
      this.primitive.bands,
      this.primitive.fillOpacity,
    );
  }
}

export class RainbowBandsPrimitive implements ISeriesPrimitive<Time> {
  chart: IChartApiBase<Time> | null = null;
  series: ISeriesApi<SeriesType, Time> | null = null;
  bands: RainbowBand[];
  fillOpacity: number;

  private paneView: RainbowBandsPaneView;
  private requestChartUpdate: (() => void) | null = null;

  constructor(bands: RainbowBand[] = DEFAULT_RAINBOW_BANDS, fillOpacity = 0.45) {
    this.bands = bands;
    this.fillOpacity = fillOpacity;
    this.paneView = new RainbowBandsPaneView(this);
  }

  setBands(bands: RainbowBand[]): void {
    this.bands = bands;
    this.requestUpdate();
  }

  requestUpdate(): void {
    this.requestChartUpdate?.();
  }

  attached(param: SeriesAttachedParameter<Time, SeriesType>): void {
    this.chart = param.chart;
    this.series = param.series;
    this.requestChartUpdate = param.requestUpdate;
  }

  detached(): void {
    this.chart = null;
    this.series = null;
    this.requestChartUpdate = null;
  }

  updateAllViews(): void {
    // No internal state to refresh — values are computed at draw time.
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.paneView];
  }

  autoscaleInfo(): AutoscaleInfo | null {
    if (!this.chart || this.bands.length === 0) return null;

    const range = this.chart.timeScale().getVisibleRange();
    if (!range) return null;

    const fromMs = timeToMs(range.from);
    const toMs = timeToMs(range.to);
    if (fromMs === null || toMs === null) return null;

    const sorted = [...this.bands].sort((a, b) => b.offset - a.offset);
    const startMs = Math.min(fromMs, toMs);
    const endMs = Math.max(fromMs, toMs);
    const minValue = rainbowPriceAt(startMs, sorted[sorted.length - 1].offset);
    const maxValue = rainbowPriceAt(endMs, sorted[0].offset);

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue <= 0 || maxValue <= minValue) {
      return null;
    }

    return {
      priceRange: { minValue, maxValue },
      margins: { above: 12, below: 12 },
    };
  }
}

/** Convert lightweight-charts `Time` to a UTC ms timestamp. For our daily
 *  data Time is always a Unix-seconds number, but we handle string + business-
 *  day shapes defensively. */
function timeToMs(t: Time): number | null {
  if (typeof t === "number") return t * 1000;
  if (typeof t === "string") {
    const parsed = Date.parse(t);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (t && typeof t === "object" && "year" in t) {
    const bd = t as { year: number; month: number; day: number };
    return Date.UTC(bd.year, bd.month - 1, bd.day);
  }
  return null;
}
