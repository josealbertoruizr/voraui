import type { SeriesMarker, UTCTimestamp } from "lightweight-charts";
import type { OhlcvCandle, TradeSignal } from "./trading-chart-types";

export const BUY_COLOR = "#00c176";
export const SELL_COLOR = "#cf304a";
export const INDICATOR_COLOR = "#8b5cf6";

export type AlignedSignal = TradeSignal & { alignedTime: UTCTimestamp };

export function floorToIntervalSeconds(tsMs: number, interval: string): number {
  const d = new Date(tsMs);
  const ms = d.getTime();
  const oneMinute = 60 * 1000;
  const Y = d.getUTCFullYear(),
    M = d.getUTCMonth(),
    D = d.getUTCDate(),
    h = d.getUTCHours();
  switch (interval) {
    case "1m":
      return Math.floor(ms / oneMinute) * 60;
    case "5m":
      return Math.floor(ms / (5 * oneMinute)) * 5 * 60;
    case "15m":
      return Math.floor(ms / (15 * oneMinute)) * 15 * 60;
    case "1h":
      return Date.UTC(Y, M, D, h, 0, 0) / 1000;
    case "4h":
      return Date.UTC(Y, M, D, Math.floor(h / 4) * 4, 0, 0) / 1000;
    case "8h":
      return Date.UTC(Y, M, D, Math.floor(h / 8) * 8, 0, 0) / 1000;
    case "1d":
      return Date.UTC(Y, M, D, 0, 0, 0) / 1000;
    case "1w": {
      // Floor to start of the week (Monday).
      const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon, ...
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return Date.UTC(Y, M, D - daysToMonday, 0, 0, 0) / 1000;
    }
    case "1M":
      return Date.UTC(Y, M, 1, 0, 0, 0) / 1000;
    default:
      return Math.floor(ms / 1000);
  }
}

export function findClosestBarTime(target: number, orderedTimes: number[]): number {
  if (!orderedTimes.length) return target;
  let closest = orderedTimes[0];
  let diff = Math.abs(target - closest);
  for (let i = 1; i < orderedTimes.length; i++) {
    const cand = orderedTimes[i];
    const candDiff = Math.abs(target - cand);
    if (candDiff < diff) {
      closest = cand;
      diff = candDiff;
    } else if (cand > target && candDiff > diff) {
      break;
    }
  }
  return closest;
}

export function alignSignalsToBars(
  signals: TradeSignal[],
  candles: OhlcvCandle[],
  interval: string,
): AlignedSignal[] {
  if (!signals?.length || !candles?.length) return [];

  const barTimes = candles.map((c) => c.time);
  const barSet = new Set(barTimes);

  return signals.map((signal) => {
    const snapped = floorToIntervalSeconds(signal.ts, interval);
    const aligned = barSet.has(snapped) ? snapped : findClosestBarTime(snapped, barTimes);

    return {
      ...signal,
      alignedTime: aligned as UTCTimestamp,
    };
  });
}

export function buildSeriesMarkers(aligned: AlignedSignal[]): SeriesMarker<UTCTimestamp>[] {
  const tradeGrouped = new Map<string, AlignedSignal[]>();
  const indicatorGrouped = new Map<string, AlignedSignal[]>();

  for (const signal of aligned) {
    if (signal.category === "indicator") {
      const indicatorKey = `${signal.alignedTime}`;
      if (!indicatorGrouped.has(indicatorKey)) indicatorGrouped.set(indicatorKey, []);
      indicatorGrouped.get(indicatorKey)!.push(signal);
      continue;
    }

    const tradeKey = `${signal.alignedTime}_${signal.side}`;
    if (!tradeGrouped.has(tradeKey)) tradeGrouped.set(tradeKey, []);
    tradeGrouped.get(tradeKey)!.push(signal);
  }

  const markers: SeriesMarker<UTCTimestamp>[] = [];

  for (const [, signals] of tradeGrouped.entries()) {
    const isBuy = signals[0].side === "BUY";
    const count = signals.length;

    markers.push({
      time: signals[0].alignedTime,
      position: isBuy ? "belowBar" : "aboveBar",
      color: isBuy ? BUY_COLOR : SELL_COLOR,
      shape: isBuy ? "arrowUp" : "arrowDown",
      size: count >= 3 ? 2 : 1.5,
      text: count > 1 ? `${count}${isBuy ? "B" : "S"}` : isBuy ? "B" : "S",
    });
  }

  for (const [, signals] of indicatorGrouped.entries()) {
    markers.push({
      time: signals[0].alignedTime,
      position: "inBar",
      color: INDICATOR_COLOR,
      shape: "circle",
      size: 1.6,
      text: "I",
    });
  }

  return markers.sort((a, b) => (a.time as number) - (b.time as number));
}
