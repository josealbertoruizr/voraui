export const DEFAULT_COLLAPSE_THRESHOLD_LINES = 30;

export function shouldCollapse(
  code: string,
  thresholdLines: number = DEFAULT_COLLAPSE_THRESHOLD_LINES,
): boolean {
  return code.split("\n").length > thresholdLines;
}
