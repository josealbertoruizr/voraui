"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import type { IChartApi, ISeriesApi, Time, UTCTimestamp } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FearGreedIndexChartSkeleton } from "./components/skeleton";
import { useFearGreedHistory } from "./hooks/use-fear-greed-history";
import { useBtcDaily } from "./hooks/use-btc-daily";
import {
  clipToRange,
  normalizeByTime,
  toIndexLineData,
  type BtcDailyPoint,
  type FearGreedPoint,
} from "./lib/fear-greed-bands";
import { FearGreedZonesPrimitive } from "./lib/zones-primitive";
import { compactUsdTick, createIndexTooltip, type IndexTooltip } from "./lib/index-tooltip";

export interface FearGreedIndexChartProps {
  /** Draw the BTC price line on the left scale. */
  showPrice?: boolean;
  /** Draw the BTC volume histogram along the bottom. */
  showVolume?: boolean;
  /** Provide your own index series to bypass the alternative.me fetcher. */
  data?: FearGreedPoint[];
  /** Provide your own BTC series to bypass the Binance fetcher. */
  btcData?: BtcDailyPoint[];
  className?: string;
}

type Preset = "30D" | "1Y" | "ALL";
const PRESETS: Preset[] = ["30D", "1Y", "ALL"];
const PRESET_DAYS: Record<Exclude<Preset, "ALL">, number> = { "30D": 30, "1Y": 365 };
const DAY_SECONDS = 86_400;
const INDEX_LEGEND_COLOR = "#f0c929";
const VOLUME_SCALE_ID = "volume";

type IndexPoint = { time: UTCTimestamp; value: number; color: string };
type ValuePoint = { time: UTCTimestamp; value: number };

/** Crypto Fear & Greed index history as a band-colored line with optional BTC price and volume. */
export function FearGreedIndexChart({
  showPrice = true,
  showVolume = false,
  data,
  btcData,
  className,
}: FearGreedIndexChartProps) {
  const { resolvedTheme } = useTheme();
  const fetched = useFearGreedHistory({ enabled: data === undefined });
  const index = useMemo(() => normalizeByTime(data ?? fetched.data ?? []), [data, fetched.data]);
  const loading = data === undefined && fetched.loading;
  const error = data === undefined ? fetched.error : null;

  const btcWanted = showPrice || showVolume;
  const fetchedBtc = useBtcDaily({
    enabled: btcWanted && btcData === undefined,
    from: index[0]?.time ?? null,
  });
  const firstIndexTime = index[0]?.time;
  const lastIndexTime = index[index.length - 1]?.time;
  const btc = useMemo(() => {
    if (!btcWanted || firstIndexTime === undefined || lastIndexTime === undefined) return [];
    const source = btcData ?? fetchedBtc.data ?? [];
    return clipToRange(normalizeByTime(source), firstIndexTime, lastIndexTime);
  }, [btcWanted, btcData, fetchedBtc.data, firstIndexTime, lastIndexTime]);

  const indexLine = useMemo<IndexPoint[]>(
    () => toIndexLineData(index).map((p) => ({ ...p, time: p.time as UTCTimestamp })),
    [index],
  );
  const priceLine = useMemo<ValuePoint[]>(
    () =>
      btc
        .filter((p) => Number.isFinite(p.price) && p.price > 0)
        .map((p) => ({ time: p.time as UTCTimestamp, value: p.price })),
    [btc],
  );
  const volumeBars = useMemo<ValuePoint[]>(
    () =>
      btc
        .filter((p) => Number.isFinite(p.volume) && p.volume >= 0)
        .map((p) => ({ time: p.time as UTCTimestamp, value: p.volume })),
    [btc],
  );

  const hasIndex = indexLine.length > 0;
  const drawPrice = showPrice && priceLine.length > 0;
  const drawVolume = showVolume && volumeBars.length > 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<IndexTooltip | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const indexSeriesRef = useRef<ISeriesApi<"Line", Time> | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line", Time> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram", Time> | null>(null);
  const primitiveRef = useRef<FearGreedZonesPrimitive | null>(null);

  const [preset, setPreset] = useState<Preset>("ALL");

  const indexLineRef = useRef<IndexPoint[]>(indexLine);
  const priceLineRef = useRef<ValuePoint[]>(priceLine);
  const volumeBarsRef = useRef<ValuePoint[]>(volumeBars);
  const presetRef = useRef<Preset>(preset);
  // Time bounds the visible range was last fitted to; unchanged bounds keep the user's zoom.
  const rangeKeyRef = useRef<string | null>(null);

  const applyVisibleRange = useCallback(() => {
    const chart = chartRef.current;
    const points = indexLineRef.current;
    if (!chart || points.length === 0) return;

    if (presetRef.current === "ALL") {
      chart.timeScale().fitContent();
      return;
    }

    const first = points[0].time as number;
    const last = points[points.length - 1].time as number;
    const from = Math.max(first, last - PRESET_DAYS[presetRef.current] * DAY_SECONDS);
    chart.timeScale().setVisibleRange({
      from: from as UTCTimestamp,
      to: last as UTCTimestamp,
    });
  }, []);

  const applyLatestData = useCallback(() => {
    const indexSeries = indexSeriesRef.current;
    const points = indexLineRef.current;
    if (!chartRef.current || !indexSeries || points.length === 0) return;

    indexSeries.setData(points);
    // The series color drives the last-value label, so it follows the latest band.
    indexSeries.applyOptions({ color: points[points.length - 1].color });
    priceSeriesRef.current?.setData(priceLineRef.current);
    volumeSeriesRef.current?.setData(volumeBarsRef.current);

    const rangeKey = `${points[0].time}:${points[points.length - 1].time}`;
    if (rangeKeyRef.current !== rangeKey) {
      rangeKeyRef.current = rangeKey;
      applyVisibleRange();
    }
    primitiveRef.current?.requestUpdate();
  }, [applyVisibleRange]);

  useEffect(() => {
    indexLineRef.current = indexLine;
    priceLineRef.current = priceLine;
    volumeBarsRef.current = volumeBars;
    applyLatestData();
  }, [indexLine, priceLine, volumeBars, applyLatestData]);

  useEffect(() => {
    presetRef.current = preset;
    applyVisibleRange();
  }, [preset, applyVisibleRange]);

  // Mount once per theme and layer set; data updates live in a separate effect.
  useEffect(() => {
    if (!hasIndex) return;

    let disposed = false;
    let ro: ResizeObserver | null = null;
    let chartInitialized = false;

    const initChart = async (container: HTMLDivElement) => {
      const lwc = await import("lightweight-charts");
      if (disposed) return;

      const isDark = resolvedTheme === "dark";
      const textColor = isDark ? "#9CA3AF" : "#52525b";
      const gridColor = isDark ? "rgba(148,163,184,0.10)" : "rgba(0,0,0,0.05)";
      const labelColor = isDark ? "rgba(156,163,175,0.7)" : "rgba(82,82,91,0.7)";
      const priceColor = isDark ? "rgba(161,161,170,0.85)" : "rgba(82,82,91,0.8)";
      const volumeColor = isDark ? "rgba(161,161,170,0.22)" : "rgba(82,82,91,0.16)";

      const chart = lwc.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        autoSize: false,
        layout: {
          background: { type: lwc.ColorType.Solid, color: "rgba(0,0,0,0)" },
          textColor,
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: { top: 0.05, bottom: 0.05 },
        },
        leftPriceScale: {
          visible: drawPrice,
          mode: lwc.PriceScaleMode.Normal,
          borderVisible: false,
          scaleMargins: { top: 0.05, bottom: 0.05 },
        },
        timeScale: {
          borderVisible: false,
          timeVisible: false,
          secondsVisible: false,
          rightOffset: 2,
          barSpacing: 4,
          fixLeftEdge: true,
          fixRightEdge: true,
          lockVisibleTimeRangeOnResize: true,
        },
        crosshair: { mode: 0 },
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
      });

      // Creation order is paint order: volume, then price, then the index on top.
      if (drawVolume) {
        volumeSeriesRef.current = chart.addSeries(lwc.HistogramSeries, {
          color: volumeColor,
          priceScaleId: VOLUME_SCALE_ID,
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
        });
        chart.priceScale(VOLUME_SCALE_ID).applyOptions({
          scaleMargins: { top: 0.82, bottom: 0 },
        });
      }

      if (drawPrice) {
        priceSeriesRef.current = chart.addSeries(lwc.LineSeries, {
          color: priceColor,
          lineWidth: 1,
          priceScaleId: "left",
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          priceFormat: { type: "custom", formatter: compactUsdTick },
        });
      }

      const indexSeries = chart.addSeries(lwc.LineSeries, {
        lineWidth: 2,
        priceScaleId: "right",
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        priceFormat: { type: "price", precision: 0, minMove: 1 },
        autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
      });

      const primitive = new FearGreedZonesPrimitive({ labelColor });
      primitiveRef.current = primitive;
      indexSeries.attachPrimitive(primitive);

      chartRef.current = chart;
      indexSeriesRef.current = indexSeries;
      applyLatestData();

      const tooltip = createIndexTooltip(container, () => ({
        index: indexSeriesRef.current,
        price: priceSeriesRef.current,
        volume: volumeSeriesRef.current,
      }));
      tooltipRef.current = tooltip;
      chart.subscribeCrosshairMove(tooltip.onCrosshairMove);
    };

    if (containerRef.current) {
      ro = new ResizeObserver((entries) => {
        const rect = entries[0].contentRect;
        if (rect.width > 0 && rect.height > 0 && !chartInitialized) {
          chartInitialized = true;
          initChart(containerRef.current!);
        } else if (chartInitialized && chartRef.current) {
          chartRef.current.applyOptions({
            width: rect.width,
            height: rect.height,
          });
        }
      });
      ro.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      if (ro) ro.disconnect();
      tooltipRef.current?.dispose();
      tooltipRef.current = null;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      indexSeriesRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
      primitiveRef.current = null;
      rangeKeyRef.current = null;
    };
  }, [applyLatestData, hasIndex, drawPrice, drawVolume, resolvedTheme]);

  if (loading) {
    return <FearGreedIndexChartSkeleton className={className} />;
  }

  if (!hasIndex) {
    return (
      <div
        role="alert"
        className={cn(
          "flex h-[220px] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground",
          className,
        )}
      >
        Fear &amp; Greed history is unavailable{error ? ` (${error})` : ""}.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <LegendEntry label="Fear & Greed Index" dotStyle={{ backgroundColor: INDEX_LEGEND_COLOR }} />
          {drawPrice && <LegendEntry label="Bitcoin Price" dotClassName="bg-muted-foreground" />}
          {drawVolume && <LegendEntry label="Bitcoin Volume" dotClassName="bg-muted-foreground/40" />}
        </div>
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={preset === p ? "default" : "outline"}
              className="h-7 px-2.5 text-[11px] font-medium"
              onClick={() => setPreset(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className={cn("relative h-[360px] w-full overflow-hidden sm:h-[420px]", "[&_canvas]:!touch-pan-y")}
      />
    </div>
  );
}

function LegendEntry({
  label,
  dotClassName,
  dotStyle,
}: {
  label: string;
  dotClassName?: string;
  dotStyle?: { backgroundColor: string };
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} style={dotStyle} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
