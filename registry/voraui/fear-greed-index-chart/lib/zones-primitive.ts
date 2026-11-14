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

export interface FearGreedZonesOptions {
  labelColor: string;
}

class FearGreedZonesRenderer implements IPrimitivePaneRenderer {
  constructor(
    private series: ISeriesApi<SeriesType, Time> | null,
    private labelColor: string,
  ) {}

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

      ctx.save();
      ctx.font = LABEL_FONT;
      ctx.fillStyle = this.labelColor;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (const band of FEAR_GREED_BANDS) {
        const y = series.priceToCoordinate((band.min + band.max) / 2);
        if (y === null) continue;
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
    return new FearGreedZonesRenderer(this.primitive.series, this.primitive.labelColor);
  }
}

/** Series primitive painting the fear (0-25) and greed (75-100) tints plus band labels. */
export class FearGreedZonesPrimitive implements ISeriesPrimitive<Time> {
  series: ISeriesApi<SeriesType, Time> | null = null;
  labelColor: string;

  private paneView: FearGreedZonesPaneView;
  private requestChartUpdate: (() => void) | null = null;

  constructor(options: FearGreedZonesOptions) {
    this.labelColor = options.labelColor;
    this.paneView = new FearGreedZonesPaneView(this);
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
    return [this.paneView];
  }
}
