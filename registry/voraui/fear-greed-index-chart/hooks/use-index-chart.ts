"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  IChartApi,
  ISeriesApi,
  LogicalRange,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { FearGreedZonesPrimitive } from "../lib/zones-primitive";
import { createIndexTooltip, type IndexTooltip } from "../lib/index-tooltip";
import {
  DENSE_BAR_SPACING,
  INDEX_SERIES_OPTIONS,
  PRICE_SCALE_MIN_WIDTH,
  VOLUME_SCALE_ID,
  VOLUME_SCALE_MARGINS,
  chartOptions,
  chartPalette,
  indexPriceFormat,
  priceScaleMargins,
  priceSeriesOptions,
  themeOptions,
  volumeSeriesOptions,
} from "../lib/chart-options";
import {
  DAY_SECONDS,
  PRESET_DAYS,
  clampLogicalRange,
  distinctTimeCount,
  labelGutterPixels,
  minBarSpacingFor,
  presetLogicalRange,
  tickDetailFor,
  tickLabelFor,
  type Preset,
  type TickDetail,
} from "../lib/chart-range";

export type IndexPoint = { time: UTCTimestamp; value: number; color: string };
export type ValuePoint = { time: UTCTimestamp; value: number };
type LightweightCharts = typeof import("lightweight-charts");

export interface UseIndexChartOptions {
  indexLine: IndexPoint[];
  priceLine: ValuePoint[];
  volumeBars: ValuePoint[];
  drawPrice: boolean;
  drawVolume: boolean;
  /** Keep the left price scale open (e.g. while BTC loads) so the plot width stays put. */
  reservePriceScale: boolean;
  theme: string | undefined;
  preset: Preset;
}

/**
 * Owns the lightweight-charts instance: mounts once when the index has data, then applies data,
 * BTC layers, theme, and presets in place so the view and zoom survive every update.
 */
export function useIndexChart({
  indexLine,
  priceLine,
  volumeBars,
  drawPrice,
  drawVolume,
  reservePriceScale,
  theme,
  preset,
}: UseIndexChartOptions) {
  const hasIndex = indexLine.length > 0;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lwcRef = useRef<LightweightCharts | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const indexSeriesRef = useRef<ISeriesApi<"Line", Time> | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line", Time> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram", Time> | null>(null);
  const primitiveRef = useRef<FearGreedZonesPrimitive | null>(null);

  const [failed, setFailed] = useState(false);

  const palette = useMemo(() => chartPalette(theme), [theme]);
  // Latest props for the chart callbacks, which outlive the render that created them.
  const latestProps = {
    indexLine,
    priceLine,
    volumeBars,
    drawPrice,
    drawVolume,
    reservePriceScale,
    preset,
    palette,
  };
  const latest = useRef(latestProps);
  // Declared first so every effect below reads this render's props.
  useEffect(() => {
    latest.current = latestProps;
  });

  // Time bounds the visible range was last fitted to; unchanged bounds keep the user's zoom.
  const rangeKeyRef = useRef<string | null>(null);
  // Pixels reserved right of the latest day for the band labels; 0 while they are hidden.
  const gutterRef = useRef(0);

  // Zoom-out stops where every day plus the label gutter fits, like fixed edges would.
  const applyZoomLimit = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const timeScale = chart.timeScale();
    const bars = distinctTimeCount([
      latest.current.indexLine,
      latest.current.priceLine,
      latest.current.volumeBars,
    ]);
    timeScale.applyOptions({
      minBarSpacing: minBarSpacingFor(timeScale.width(), gutterRef.current, bars),
    });
  }, []);

  const applyVisibleRange = useCallback(() => {
    const chart = chartRef.current;
    const points = latest.current.indexLine;
    if (!chart || points.length === 0) return;
    const timeScale = chart.timeScale();

    if (latest.current.preset === "ALL") {
      timeScale.fitContent();
      return;
    }

    const first = points[0].time as number;
    const last = points[points.length - 1].time as number;
    const from = Math.max(first, last - PRESET_DAYS[latest.current.preset] * DAY_SECONDS);
    const fromIndex = timeScale.timeToIndex(from as UTCTimestamp, true);
    const toIndex = timeScale.timeToIndex(last as UTCTimestamp, true);
    if (fromIndex === null || toIndex === null) return;
    timeScale.setVisibleLogicalRange(
      presetLogicalRange(fromIndex, toIndex, timeScale.width(), gutterRef.current),
    );
  }, []);

  const applyLatestData = useCallback(() => {
    const indexSeries = indexSeriesRef.current;
    const points = latest.current.indexLine;
    if (!chartRef.current || !indexSeries || points.length === 0) return;

    indexSeries.setData(points);
    // The series color drives the last-value label, so it follows the latest band.
    const latestPoint = points[points.length - 1];
    indexSeries.applyOptions({
      color: latestPoint.color,
      priceFormat: indexPriceFormat(latestPoint.value),
    });
    priceSeriesRef.current?.setData(latest.current.priceLine);
    volumeSeriesRef.current?.setData(latest.current.volumeBars);

    applyZoomLimit();
    const rangeKey = `${points[0].time}:${points[points.length - 1].time}`;
    if (rangeKeyRef.current !== rangeKey) {
      rangeKeyRef.current = rangeKey;
      applyVisibleRange();
    }
    primitiveRef.current?.requestUpdate();
  }, [applyVisibleRange, applyZoomLimit]);

  // Adds or removes the BTC layers on the live chart so the index view and zoom survive.
  const syncLayers = useCallback(() => {
    const lwc = lwcRef.current;
    const chart = chartRef.current;
    if (!lwc || !chart) return;
    const palette = latest.current.palette;

    if (latest.current.drawVolume && !volumeSeriesRef.current) {
      const volumeSeries = chart.addSeries(lwc.HistogramSeries, volumeSeriesOptions(palette));
      chart.priceScale(VOLUME_SCALE_ID).applyOptions({ scaleMargins: VOLUME_SCALE_MARGINS });
      volumeSeries.setData(latest.current.volumeBars);
      volumeSeriesRef.current = volumeSeries;
    } else if (!latest.current.drawVolume && volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    if (latest.current.drawPrice && !priceSeriesRef.current) {
      const priceSeries = chart.addSeries(lwc.LineSeries, priceSeriesOptions(palette));
      priceSeries.setData(latest.current.priceLine);
      priceSeriesRef.current = priceSeries;
    } else if (!latest.current.drawPrice && priceSeriesRef.current) {
      chart.removeSeries(priceSeriesRef.current);
      priceSeriesRef.current = null;
    }

    // Paint order: volume, then price, then the index on top.
    volumeSeriesRef.current?.setSeriesOrder(0);
    priceSeriesRef.current?.setSeriesOrder(volumeSeriesRef.current ? 1 : 0);
    chart.applyOptions({
      leftPriceScale: {
        visible: latest.current.reservePriceScale,
        minimumWidth: PRICE_SCALE_MIN_WIDTH,
        scaleMargins: priceScaleMargins(latest.current.drawVolume),
      },
    });
  }, []);

  useEffect(() => applyLatestData(), [indexLine, priceLine, volumeBars, applyLatestData]);

  useEffect(() => syncLayers(), [drawPrice, drawVolume, reservePriceScale, syncLayers]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions(themeOptions(palette));
    priceSeriesRef.current?.applyOptions({ color: palette.price });
    volumeSeriesRef.current?.applyOptions({ color: palette.volume });
    primitiveRef.current?.setColors(palette.label, palette.halo);
  }, [palette]);

  useEffect(() => applyVisibleRange(), [preset, applyVisibleRange]);

  // Mount once; theme, layers, and data are applied in place by the effects above.
  useEffect(() => {
    if (!hasIndex) return;

    let disposed = false;
    let ro: ResizeObserver | null = null;
    let chartInitialized = false;
    let tooltip: IndexTooltip | null = null;

    const initChart = async (container: HTMLDivElement) => {
      const lwc = await import("lightweight-charts");
      if (disposed) return;
      lwcRef.current = lwc;
      const palette = latest.current.palette;

      const chart = lwc.createChart(
        container,
        chartOptions(
          palette,
          container.clientWidth,
          container.clientHeight,
          // The canvas does not inherit CSS, so the axis labels are handed the app's font.
          getComputedStyle(container).fontFamily,
        ),
      );
      chartRef.current = chart;
      const timeScale = chart.timeScale();

      const indexSeries = chart.addSeries(lwc.LineSeries, INDEX_SERIES_OPTIONS);
      indexSeriesRef.current = indexSeries;

      const primitive = new FearGreedZonesPrimitive({
        labelColor: palette.label,
        haloColor: palette.halo,
      });
      primitiveRef.current = primitive;
      indexSeries.attachPrimitive(primitive);

      // Fires on the first layout too, so the label column is decided from the real plot width.
      timeScale.subscribeSizeChange((plotWidth) => {
        const gutter = labelGutterPixels(plotWidth);
        if (gutter !== gutterRef.current) {
          gutterRef.current = gutter;
          primitive.setLabelsVisible(gutter > 0);
          timeScale.applyOptions({ rightOffsetPixels: gutter });
          applyZoomLimit();
          applyVisibleRange();
          return;
        }
        applyZoomLimit();
      });

      let tickDetail: TickDetail | null = null;
      timeScale.subscribeVisibleLogicalRangeChange((range) => {
        const barSpacing = timeScale.options().barSpacing;
        // Setting the formatter also drops the library's cached labels for the old zoom level.
        const detail = tickDetailFor(barSpacing);
        if (detail !== tickDetail) {
          tickDetail = detail;
          chart.applyOptions({
            timeScale: { tickMarkFormatter: (_time: Time, type: number) => tickLabelFor(type, detail) },
          });
        }

        // Thin the index line when days are packed tighter than its stroke.
        const lineWidth = barSpacing < DENSE_BAR_SPACING ? 1 : 2;
        if (indexSeries.options().lineWidth !== lineWidth) indexSeries.applyOptions({ lineWidth });

        // Without fixRightEdge, panning is bounded here: never past the label column.
        const points = latest.current.indexLine;
        if (!range || points.length === 0) return;
        const lastIndex = timeScale.timeToIndex(points[points.length - 1].time, true);
        if (lastIndex === null) return;
        const clamped = clampLogicalRange(range, lastIndex + 1, gutterRef.current / barSpacing);
        // The clamp's tolerance, not a guard here, is what stops this from re-triggering itself.
        if (clamped !== range) timeScale.setVisibleLogicalRange(clamped as LogicalRange);
      });

      syncLayers();
      applyLatestData();

      tooltip = createIndexTooltip(
        container,
        () => ({
          index: indexSeriesRef.current,
          price: priceSeriesRef.current,
          volume: volumeSeriesRef.current,
        }),
        // 0 while the left scale is hidden (index only), or shown but not laid out yet: the
        // library throws for that one frame instead of reporting 0.
        () => {
          try {
            return chart.priceScale("left").width();
          } catch {
            return 0;
          }
        },
      );
      chart.subscribeCrosshairMove(tooltip.onCrosshairMove);
    };

    if (containerRef.current) {
      ro = new ResizeObserver((entries) => {
        const rect = entries[0].contentRect;
        if (rect.width > 0 && rect.height > 0 && !chartInitialized) {
          chartInitialized = true;
          initChart(containerRef.current!).catch(() => {
            if (!disposed) setFailed(true);
          });
        } else if (chartInitialized && chartRef.current) {
          chartRef.current.applyOptions({ width: rect.width, height: rect.height });
        }
      });
      ro.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      if (ro) ro.disconnect();
      tooltip?.dispose();
      // remove() also drops the time scale subscriptions made above.
      chartRef.current?.remove();
      chartRef.current = null;
      indexSeriesRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
      primitiveRef.current = null;
      rangeKeyRef.current = null;
      gutterRef.current = 0;
    };
  }, [applyLatestData, applyVisibleRange, applyZoomLimit, syncLayers, hasIndex]);

  return { containerRef, failed, refit: applyVisibleRange };
}
