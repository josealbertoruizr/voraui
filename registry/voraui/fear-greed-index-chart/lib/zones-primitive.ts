import type {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from "lightweight-charts";
import { FEAR_GREED_BANDS } from "./fear-greed-bands";

// Structural subset of fancy-canvas's CanvasRenderingTarget2D (not a direct dependency).
interface MediaScope {
  context: CanvasRenderingContext2D;
  mediaSize: { width: number; height: number };
}
interface CanvasRenderingTarget2D {
  useMediaCoordinateSpace<T>(fn: (scope: MediaScope) => T): T;
}

const ZONES = [
  { from: 0, to: 25, color: "#c0392b" },
  { from: 75, to: 100, color: "#2e7d32" },
];
const ZONE_OPACITY = 0.1;
const LABEL_FONT =
  "11px -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
const LABEL_INSET = 8;
const LABEL_HALO_WIDTH = 3;
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

export interface FearGreedZonesOptions {
  labelColor: string;
  /** Outline drawn around each label so it stays legible over the lines. */
  haloColor: string;
}

class FearGreedZonesRenderer implements IPrimitivePaneRenderer {
  constructor(private series: ISeriesApi<SeriesType, Time> | null) {}

  draw(target: CanvasRenderingTarget2D): void {
    const series = this.series;
    if (!series) return;

    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      const width = mediaSize.width;
      if (width <= 0) return;

      ctx.save();
      ctx.globalAlpha = ZONE_OPACITY;
      for (const zone of ZONES) {
        const top = series.priceToCoordinate(zone.to);
        const bottom = series.priceToCoordinate(zone.from);
        if (top === null || bottom === null) continue;
        ctx.fillStyle = zone.color;
        ctx.fillRect(0, top, width, bottom - top);
      }
      ctx.restore();
    });
  }
}

class FearGreedLabelsRenderer implements IPrimitivePaneRenderer {
  constructor(
    private series: ISeriesApi<SeriesType, Time> | null,
    private labelColor: string,
    private haloColor: string,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    const series = this.series;
    if (!series) return;

    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      const width = mediaSize.width;
      if (width <= 0) return;

      ctx.save();
      ctx.font = LABEL_FONT;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = LABEL_HALO_WIDTH;
      ctx.strokeStyle = this.haloColor;
      ctx.fillStyle = this.labelColor;
      for (const band of FEAR_GREED_BANDS) {
        const y = series.priceToCoordinate((band.min + band.max) / 2);
        if (y === null) continue;
        ctx.strokeText(band.label, width - LABEL_INSET, y);
        ctx.fillText(band.label, width - LABEL_INSET, y);
      }
      ctx.restore();
    });
  }
}

class FearGreedZonesPaneView implements IPrimitivePaneView {
  constructor(private primitive: FearGreedZonesPrimitive) {}

  zOrder() {
    return "bottom" as const;
  }

  renderer(): IPrimitivePaneRenderer | null {
    return new FearGreedZonesRenderer(this.primitive.series);
  }
}

class FearGreedLabelsPaneView implements IPrimitivePaneView {
  constructor(private primitive: FearGreedZonesPrimitive) {}

  zOrder() {
    return "top" as const;
  }

  renderer(): IPrimitivePaneRenderer | null {
    const { series, labelColor, haloColor } = this.primitive;
    return new FearGreedLabelsRenderer(series, labelColor, haloColor);
  }
}

/** Series primitive painting the fear (0-25) and greed (75-100) tints plus band labels. */
export class FearGreedZonesPrimitive implements ISeriesPrimitive<Time> {
  series: ISeriesApi<SeriesType, Time> | null = null;
  labelColor: string;
  haloColor: string;

  private paneViewsList: readonly IPrimitivePaneView[];
  private requestChartUpdate: (() => void) | null = null;

  constructor(options: FearGreedZonesOptions) {
    this.labelColor = options.labelColor;
    this.haloColor = options.haloColor;
    this.paneViewsList = [new FearGreedZonesPaneView(this), new FearGreedLabelsPaneView(this)];
  }

  setColors(labelColor: string, haloColor: string): void {
    this.labelColor = labelColor;
    this.haloColor = haloColor;
    this.requestUpdate();
  }

  requestUpdate(): void {
    this.requestChartUpdate?.();
  }

  attached(param: SeriesAttachedParameter<Time, SeriesType>): void {
    this.series = param.series;
    this.requestChartUpdate = param.requestUpdate;
  }

  detached(): void {
    this.series = null;
    this.requestChartUpdate = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.paneViewsList;
  }
}
