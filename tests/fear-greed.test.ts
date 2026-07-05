import { describe, expect, it } from "vitest";
import { parseFngResponse } from "@/registry/voraui/fear-greed-gauge/use-fear-greed";

describe("parseFngResponse", () => {
  it("parses a valid alternative.me payload", () => {
    const raw = {
      data: [{ value: "72", value_classification: "Greed", timestamp: "1751587200" }],
    };
    expect(parseFngResponse(raw)).toEqual({ value: 72, label: "Greed", updatedAt: "1751587200" });
  });

  it("returns nulls for an empty payload", () => {
    expect(parseFngResponse({})).toEqual({ value: null, label: "Unknown", updatedAt: null });
    expect(parseFngResponse(null)).toEqual({ value: null, label: "Unknown", updatedAt: null });
  });

  it("nulls out a non-numeric value but keeps the label", () => {
    const raw = { data: [{ value: "abc", value_classification: "Fear", timestamp: null }] };
    expect(parseFngResponse(raw)).toEqual({ value: null, label: "Fear", updatedAt: null });
  });
});
