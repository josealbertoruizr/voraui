import { describe, expect, it } from "vitest";
import { shouldCollapse } from "@/lib/code-block";

describe("shouldCollapse", () => {
  it("does not collapse code at or under the default threshold (30 lines)", () => {
    const code = Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n");
    expect(shouldCollapse(code)).toBe(false);
  });

  it("collapses code over the default threshold", () => {
    const code = Array.from({ length: 31 }, (_, i) => `line ${i}`).join("\n");
    expect(shouldCollapse(code)).toBe(true);
  });

  it("respects a custom threshold", () => {
    const code = Array.from({ length: 5 }, (_, i) => `line ${i}`).join("\n");
    expect(shouldCollapse(code, 4)).toBe(true);
    expect(shouldCollapse(code, 5)).toBe(false);
  });
});
