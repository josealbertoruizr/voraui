"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { useTheme } from "next-themes";
import { getThemeOptions } from "./chart-options";
import type { ChartState } from "./use-chart-instance";

/** Restyle the chart when the next-themes theme changes. */
export function useChartTheme(stateRef: RefObject<ChartState>) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    stateRef.current.chart?.applyOptions(getThemeOptions(resolvedTheme));
  }, [stateRef, resolvedTheme]);
}
