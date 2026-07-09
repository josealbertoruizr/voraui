import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AltseasonGaugeSkeleton } from "@/registry/voraui/altseason-gauge/altseason-gauge-skeleton";
import { AltseasonGauge } from "@/registry/voraui/altseason-gauge/altseason-gauge";

describe("AltseasonGaugeSkeleton", () => {
  it("renders a status role with an accessible loading label", () => {
    const html = renderToStaticMarkup(React.createElement(AltseasonGaugeSkeleton, {}));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading Altseason Index");
  });

  it("draws a 24-bar ghost row for the bars variant and a track for the meter variant", () => {
    const bars = renderToStaticMarkup(React.createElement(AltseasonGaugeSkeleton, { variant: "bars" }));
    const meter = renderToStaticMarkup(React.createElement(AltseasonGaugeSkeleton, { variant: "meter" }));
    expect((bars.match(/rounded-\[2px\]/g) ?? []).length).toBe(24);
    expect(meter).toContain("rounded-full bg-muted");
  });
});

describe("AltseasonGauge loading state", () => {
  it("renders the skeleton instead of the spinner while data is unresolved", () => {
    const html = renderToStaticMarkup(React.createElement(AltseasonGauge, {}));
    expect(html).toContain("voraui-skeleton-shimmer");
    expect(html).not.toContain("animate-spin");
  });
});
