export type AltseasonWindow = "24h" | "7d";

export type AltseasonLabel = "Altcoin Season" | "Bitcoin Season" | "Mixed" | "Unknown";

export interface PaprikaTicker {
  symbol?: string | null;
  rank?: number | null;
  quotes?: { USD?: Partial<Record<string, number | null>> } | null;
}

export interface AltseasonData {
  /** 0-100 score, or null when it cannot be computed. */
  score: number | null;
  label: AltseasonLabel;
  /** BTC change over the window, in percent. */
  btcChangePct: number | null;
  window: AltseasonWindow;
  /** Number of alts included in the comparison (up to 50). */
  compared: number;
  /** Number of those alts outperforming BTC. */
  outperforming: number;
}

/** CoinPaprika column suffixes under quotes.USD, per window. */
export const WINDOW_KEYS: Record<AltseasonWindow, string> = {
  "24h": "percent_change_24h",
  "7d": "percent_change_7d",
};

/**
 * Stablecoins plus wrapped/liquid-staked BTC and ETH derivatives.
 * Excluded because their price barely moves vs USD or simply tracks the
 * underlying asset, which would double-count BTC/ETH.
 */
export const ALTSEASON_EXCLUDED_SYMBOLS = new Set([
  "USDT", "USDC", "DAI", "BUSD", "TUSD", "FDUSD", "PYUSD", "USDD", "USDE", "USDS",
  "WBTC", "BTCB", "WETH", "STETH", "WSTETH", "RETH", "WEETH", "CBBTC", "TBTC",
]);

/**
 * Altcoin Season Index: percentage of the top-50 (non-stable, non-wrapped)
 * altcoins outperforming BTC over the window.
 * Convention (blockchaincenter.net): score >= 75 is Altcoin Season,
 * <= 25 is Bitcoin Season, in between is Mixed.
 */
export function computeAltseason(
  tickers: PaprikaTicker[],
  window: AltseasonWindow = "7d",
): AltseasonData {
  const key = WINDOW_KEYS[window];
  const rows = [...tickers].sort((a, b) => (a.rank ?? 1_000_000) - (b.rank ?? 1_000_000));

  const changeOf = (row: PaprikaTicker): number | null => {
    const value = row.quotes?.USD?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };

  let btcChange: number | null = null;
  for (const row of rows) {
    if ((row.symbol ?? "").toUpperCase() === "BTC") {
      btcChange = changeOf(row);
      break;
    }
  }

  if (btcChange === null) {
    return { score: null, label: "Unknown", btcChangePct: null, window, compared: 0, outperforming: 0 };
  }

  const clean = rows
    .filter((row) => {
      const symbol = (row.symbol ?? "").toUpperCase();
      return symbol !== "BTC" && !ALTSEASON_EXCLUDED_SYMBOLS.has(symbol) && changeOf(row) !== null;
    })
    .slice(0, 50);

  // CoinPaprika's bulk tickers endpoint occasionally serves a dead column:
  // every ticker (including BTC) reports exactly 0 for a given window (seen
  // in practice for 30d/1y). That is upstream data unavailability, not a
  // real market reading where every asset happened to be flat, so treat an
  // all-zero column as unknown rather than scoring it as "Bitcoin Season".
  if (btcChange === 0 && clean.every((row) => changeOf(row) === 0)) {
    return { score: null, label: "Unknown", btcChangePct: null, window, compared: 0, outperforming: 0 };
  }

  const outperforming = clean.filter((row) => (changeOf(row) as number) > (btcChange as number)).length;
  const compared = clean.length;
  const score = compared > 0 ? (outperforming / compared) * 100 : null;

  const label: AltseasonLabel =
    score === null ? "Unknown" : score >= 75 ? "Altcoin Season" : score <= 25 ? "Bitcoin Season" : "Mixed";

  return {
    score: score === null ? null : Math.round(score * 10) / 10,
    label,
    btcChangePct: Math.round(btcChange * 100) / 100,
    window,
    compared,
    outperforming,
  };
}
