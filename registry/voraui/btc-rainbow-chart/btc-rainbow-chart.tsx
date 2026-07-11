"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { BtcRainbowChartSkeleton } from "./btc-rainbow-chart-skeleton";
import type { IChartApi, ISeriesApi, Time, UTCTimestamp } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RainbowBandsPrimitive, DEFAULT_RAINBOW_BANDS } from "./rainbow-bands";
import { createRainbowTooltip, type RainbowTooltip } from "./rainbow-tooltip";
import { useBtcHistory, type RainbowPoint } from "./use-btc-history";

export interface BtcRainbowChartProps {
  /** Provide your own daily BTC series to bypass the bundled fetcher. */
  data?: RainbowPoint[];
  className?: string;
}

type Preset = "1Y" | "5Y" | "10Y" | "ALL";
const PRESETS: Preset[] = ["1Y", "5Y", "10Y", "ALL"];
type ChartPoint = { time: UTCTimestamp; value: number };

export function BtcRainbowChart({ data, className }: BtcRainbowChartProps) {
  const { resolvedTheme } = useTheme();
  const fetched = useBtcHistory({ enabled: data === undefined });
  const series = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const error = data === undefined ? fetched.error : null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<RainbowTooltip | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line", Time> | null>(null);
  const primitiveRef = useRef<RainbowBandsPrimitive | null>(null);

  const [preset, setPreset] = useState<Preset>("ALL");

  const lineData = useMemo<ChartPoint[]>(() => {
    return (series ?? [])
      .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.price) && p.time > 0 && p.price > 0)
      .map((p) => ({ time: p.time as UTCTimestamp, value: p.price }));
  }, [series]);

  const lineDataRef = useRef<ChartPoint[]>(lineData);
  const presetRef = useRef<Preset>(preset);
  const hasLineData = lineData.length > 0;

  const applyVisibleRange = useCallback(() => {
    const chart = chartRef.current;
    const points = lineDataRef.current;
    if (!chart || points.length === 0) return;

    if (presetRef.current === "ALL") {
      chart.timeScale().fitContent();
      return;
    }

    const first = points[0].time as number;
    const last = points[points.length - 1].time as number;
    const yearSeconds = 365 * 86_400;
    const years = presetRef.current === "1Y" ? 1 : presetRef.current === "5Y" ? 5 : 10;
    const from = Math.max(first, last - years * yearSeconds);
    chart.timeScale().setVisibleRange({
      from: from as UTCTimestamp,
      to: last as UTCTimestamp,
    });
  }, []);

  const applyLatestData = useCallback(() => {
    const lineSeries = seriesRef.current;
    const chart = chartRef.current;
    const points = lineDataRef.current;
    if (!lineSeries || !chart || points.length === 0) return;

    lineSeries.setData(points);
    applyVisibleRange();
    primitiveRef.current?.requestUpdate();
  }, [applyVisibleRange]);

  useEffect(() => {
    lineDataRef.current = lineData;
    applyLatestData();
  }, [lineData, applyLatestData]);

  useEffect(() => {
    presetRef.current = preset;
    applyVisibleRange();
  }, [preset, applyVisibleRange]);

  // Mount once per theme; data updates live in a separate effect.
  useEffect(() => {
    if (!hasLineData) return;

    let disposed = false;
    let ro: ResizeObserver | null = null;
    let chartInitialized = false;

    const initChart = async (container: HTMLDivElement) => {
      const lwc = await import("lightweight-charts");
      if (disposed) return;

      const isDark = resolvedTheme === "dark";
      const textColor = isDark ? "#9CA3AF" : "#52525b";
      const gridColor = isDark ? "rgba(148,163,184,0.10)" : "rgba(0,0,0,0.05)";
      const lineColor = isDark ? "#fafafa" : "#111111";

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
          mode: lwc.PriceScaleMode.Logarithmic,
          borderVisible: false,
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

      const lineSeries = chart.addSeries(lwc.LineSeries, {
        color: lineColor,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });

      const primitive = new RainbowBandsPrimitive(DEFAULT_RAINBOW_BANDS, 0.45);
      primitiveRef.current = primitive;
      lineSeries.attachPrimitive(primitive);

      chartRef.current = chart;
      seriesRef.current = lineSeries;
      applyLatestData();

      const tooltip = createRainbowTooltip(container, () => seriesRef.current);
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
      seriesRef.current = null;
      primitiveRef.current = null;
    };
  }, [applyLatestData, hasLineData, resolvedTheme]);

  if (loading) {
    return <BtcRainbowChartSkeleton className={className} />;
  }

  if (!hasLineData) {
    return (
      <div
        role="alert"
        className={cn(
          "flex h-[220px] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground",
          className,
        )}
      >
        BTC price history is unavailable{error ? ` (${error})` : ""}.
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-end gap-1">
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
      <div
        ref={containerRef}
        className={cn("relative h-[360px] w-full overflow-hidden sm:h-[420px]", "[&_canvas]:!touch-pan-y")}
      />
    </div>
  );
}

export function BtcRainbowLegend() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {DEFAULT_RAINBOW_BANDS.map((b) => (
          <div key={b.key} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: b.color }}
              aria-hidden
            />
            <span className="truncate text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        Log-regression model. Binance history plus a bundled 2010-2017 seed.
      </p>
    </div>
  );
}
