"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const CELL_SIZE = 8;
const SQUARE_SIZE = 4;
const MAX_OPACITY = 0.35;
const MIN_OPACITY = 0;
const FLICKER_STEP = 0.05;

export interface GridCell {
  cx: number;
  cy: number;
}

/** Centers of an evenly spaced square grid covering a width x height area,
 *  `cellSize` apart, starting at half-pitch so the grid isn't clipped at the top/left edge. */
export function buildGrid(width: number, height: number, cellSize: number): GridCell[] {
  if (width <= 0 || height <= 0 || cellSize <= 0) return [];
  const cells: GridCell[] = [];
  for (let cy = cellSize / 2; cy < height; cy += cellSize) {
    for (let cx = cellSize / 2; cx < width; cx += cellSize) {
      cells.push({ cx, cy });
    }
  }
  return cells;
}

/** Radial falloff multiplier in [0, 1]: 1 at the canvas center, tapering
 *  linearly to 0 at the distance from center to the nearest edge. */
export function radialFalloff(cx: number, cy: number, width: number, height: number): number {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.min(centerX, centerY);
  if (maxDist <= 0) return 0;
  const dist = Math.hypot(cx - centerX, cy - centerY);
  return Math.max(0, 1 - dist / maxDist);
}

/** One random-walk opacity step, clamped to [min, max]. `rand` is injectable
 *  for deterministic testing; defaults to Math.random. */
export function stepOpacity(
  current: number,
  min = MIN_OPACITY,
  max = MAX_OPACITY,
  step = FLICKER_STEP,
  rand: () => number = Math.random,
): number {
  const delta = (rand() * 2 - 1) * step;
  return Math.min(max, Math.max(min, current + delta));
}

export interface FlickeringGridProps {
  className?: string;
}

export function FlickeringGrid({ className }: FlickeringGridProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cells: GridCell[] = [];
    let opacities: number[] = [];
    let width = 0;
    let height = 0;
    let rafId = 0;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = container!.clientWidth;
      height = container!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.scale(dpr, dpr);
      cells = buildGrid(width, height, CELL_SIZE);
      opacities = cells.map(() => Math.random() * MAX_OPACITY);
      draw();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const color = getComputedStyle(canvas!).color;
      cells.forEach((cell, i) => {
        const falloff = radialFalloff(cell.cx, cell.cy, width, height);
        ctx!.fillStyle = color;
        ctx!.globalAlpha = opacities[i] * falloff;
        ctx!.fillRect(cell.cx - SQUARE_SIZE / 2, cell.cy - SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
      });
      ctx!.globalAlpha = 1;
    }

    function tick() {
      opacities = opacities.map((o) => stepOpacity(o));
      draw();
      rafId = requestAnimationFrame(tick);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    if (!reduceMotion) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={cn("pointer-events-none text-foreground", className)} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
