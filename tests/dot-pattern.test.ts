import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DotPattern } from "@/components/site/dot-pattern";

describe("DotPattern", () => {
  it("renders an aria-hidden, pointer-events-none wrapper", () => {
    const html = renderToStaticMarkup(React.createElement(DotPattern, {}));
    expect(html).toContain("aria-hidden");
    expect(html).toContain("pointer-events-none");
  });

  it("forwards the className to the wrapper element", () => {
    const html = renderToStaticMarkup(React.createElement(DotPattern, { className: "absolute inset-0 -z-10" }));
    expect(html).toContain("absolute inset-0 -z-10");
  });

  it("dims the dots in dark mode instead of inheriting near-white foreground", () => {
    const html = renderToStaticMarkup(React.createElement(DotPattern, {}));
    expect(html).toContain("dark:text-muted-foreground/25");
  });
});
