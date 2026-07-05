"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import type { IChartApi, ISeriesApi, Time, UTCTimestamp } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RainbowBandsPrimitive,
  DEFAULT_RAINBOW_BANDS,
  findActiveBand,
  type RainbowBand,
} from "./rainbow-bands";
import { useBtcHistory, type RainbowPoint } from "./use-btc-history";

export interface BtcRainbowChartProps {
  /** Provide your own daily BTC series to bypass the bundled fetcher. */
  data?: RainbowPoint[];
  /** Override band labels/colors. Offsets should match the regression model. */
  bands?: RainbowBand[];
  className?: string;
}

type Preset = "1Y" | "5Y" | "10Y" | "ALL";
const PRESETS: Preset[] = ["1Y", "5Y", "10Y", "ALL"];
type ChartPoint = { time: UTCTimestamp; value: number };

function compactUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

export function BtcRainbowChart({ data, bands: bandsProp, className }: BtcRainbowChartProps) {
  const { resolvedTheme } = useTheme();
  const fetched = useBtcHistory({ enabled: data === undefined });
  const series = data ?? fetched.data;
  const loading = data === undefined && fetched.loading;
  const error = data === undefined ? fetched.error : null;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const seriesRef = React.useRef<ISeriesApi<"Line", Time> | null>(null);
  const bandsRef = React.useRef<RainbowBand[]>(DEFAULT_RAINBOW_BANDS);
  const primitiveRef = React.useRef<RainbowBandsPrimitive | null>(null);

  const [preset, setPreset] = React.useState<Preset>("ALL");

  const bands = React.useMemo<RainbowBand[]>(
    () => bandsProp ?? DEFAULT_RAINBOW_BANDS,
    [bandsProp],
  );

  const lineData = React.useMemo<ChartPoint[]>(() => {
    return (series ?? [])
      .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.price) && p.time > 0 && p.price > 0)
      .map((p) => ({ time: p.time as UTCTimestamp, value: p.price }));
  }, [series]);

  const lineDataRef = React.useRef<ChartPoint[]>(lineData);
  const presetRef = React.useRef<Preset>(preset);
  const hasLineData = lineData.length > 0;

  const applyVisibleRange = React.useCallback(() => {
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

  const applyLatestData = React.useCallback(() => {
    const lineSeries = seriesRef.current;
    const chart = chartRef.current;
    const points = lineDataRef.current;
    if (!lineSeries || !chart || points.length === 0) return;

    lineSeries.setData(points);
    applyVisibleRange();
    primitiveRef.current?.requestUpdate();
  }, [applyVisibleRange]);

  // Keep bands accessible to the tooltip callback even though it captures
  // its closure at mount time.
  React.useEffect(() => {
    bandsRef.current = bands;
    primitiveRef.current?.setBands(bands);
  }, [bands]);

  React.useEffect(() => {
    lineDataRef.current = lineData;
    applyLatestData();
  }, [lineData, applyLatestData]);

  React.useEffect(() => {
    presetRef.current = preset;
    applyVisibleRange();
  }, [preset, applyVisibleRange]);

  // Mount the chart once per theme. Data updates happen in a separate effect
  // so a fresh fetch doesn't tear down the chart instance.
  React.useEffect(() => {
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

      const primitive = new RainbowBandsPrimitive(bandsRef.current, 0.45);
      primitiveRef.current = primitive;
      lineSeries.attachPrimitive(primitive);

      chartRef.current = chart;
      seriesRef.current = lineSeries;
      applyLatestData();

      // Floating tooltip
      const tooltip = document.createElement("div");
      tooltip.style.position = "absolute";
      tooltip.style.zIndex = "30";
      tooltip.style.pointerEvents = "none";
      tooltip.style.display = "none";
      tooltip.className =
        "rounded-lg border border-zinc-800 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm";
      container.appendChild(tooltip);
      tooltipRef.current = tooltip;

      chart.subscribeCrosshairMove((param) => {
        if (
          !param.point ||
          !param.time ||
          param.point.x < 0 ||
          param.point.y < 0 ||
          param.point.x > container.clientWidth ||
          param.point.y > container.clientHeight
        ) {
          tooltip.style.display = "none";
          return;
        }
        const priceData = param.seriesData.get(lineSeries) as { value: number } | undefined;
        if (!priceData) {
          tooltip.style.display = "none";
          return;
        }
        const ts = typeof param.time === "number" ? param.time * 1000 : NaN;
        if (!Number.isFinite(ts)) {
          tooltip.style.display = "none";
          return;
        }
        const date = new Date(ts);
        const dateStr = date.toISOString().slice(0, 10);
        const band = findActiveBand(priceData.value, ts, bandsRef.current);

        tooltip.innerHTML = `
          <div class="text-zinc-400">${dateStr}</div>
          <div class="mt-1 font-semibold text-white tabular-nums">${compactUsd(priceData.value)}</div>
          ${band
            ? `<div class="mt-1.5 flex items-center gap-1.5">
                 <span class="h-2 w-2 shrink-0 rounded-full" style="background-color:${band.color}"></span>
                 <span class="text-[11px] text-zinc-300">${band.label}</span>
               </div>`
            : ""}
        `;

        tooltip.style.display = "block";
        const ttWidth = tooltip.offsetWidth || 140;
        const ttHeight = tooltip.offsetHeight || 60;
        let left = param.point.x + 12;
        let top = param.point.y - ttHeight - 12;
        if (left + ttWidth > container.clientWidth - 4) {
          left = param.point.x - ttWidth - 12;
        }
        if (top < 4) top = param.point.y + 12;
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      });
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
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
      primitiveRef.current = null;
    };
  }, [applyLatestData, hasLineData, resolvedTheme]);

  if (loading) {
    return (
      <div className={cn("flex h-[360px] items-center justify-center sm:h-[420px]", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasLineData) {
    return (
      <div
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

export function BtcRainbowLegend({ bands = DEFAULT_RAINBOW_BANDS }: { bands?: RainbowBand[] }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {bands.map((b) => (
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
