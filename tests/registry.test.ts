import { describe, expect, it } from "vitest";
import { getRegistryItem, readRegistryFile } from "@/lib/registry";

describe("getRegistryItem", () => {
  it("returns the fear-greed-gauge item with its real files, dependencies, and registry dependencies", () => {
    const item = getRegistryItem("fear-greed-gauge");
    expect(item.title).toBe("Fear & Greed Gauge");
    expect(item.dependencies).toEqual(["@number-flow/react", "framer-motion"]);
    expect(item.registryDependencies).toEqual(["utils"]);
    expect(item.files).toEqual([
      {
        path: "registry/voraui/fear-greed-gauge/index.ts",
        type: "registry:lib",
        target: "components/voraui/fear-greed-gauge/index.ts",
      },
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/components/skeleton.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge/components/skeleton.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/hooks/use-fear-greed.ts",
        type: "registry:hook",
        target: "components/voraui/fear-greed-gauge/hooks/use-fear-greed.ts",
      },
      {
        path: "registry/voraui/fear-greed-gauge/lib/fear-greed-bands.ts",
        type: "registry:lib",
        target: "components/voraui/fear-greed-gauge/lib/fear-greed-bands.ts",
      },
    ]);
  });

  it("returns the fear-greed-index-chart item", () => {
    const item = getRegistryItem("fear-greed-index-chart");
    expect(item.title).toBe("Fear & Greed Index Chart");
    expect(item.dependencies).toEqual(["lightweight-charts", "next-themes"]);
    expect(item.registryDependencies).toEqual(["button", "utils"]);
    expect(item.files.map((f) => f.target)).toEqual([
      "components/voraui/fear-greed-index-chart/index.ts",
      "components/voraui/fear-greed-index-chart/fear-greed-index-chart.tsx",
      "components/voraui/fear-greed-index-chart/components/skeleton.tsx",
      "components/voraui/fear-greed-index-chart/hooks/use-fear-greed-history.ts",
      "components/voraui/fear-greed-index-chart/hooks/use-btc-daily.ts",
      "components/voraui/fear-greed-index-chart/lib/fear-greed-bands.ts",
      "components/voraui/fear-greed-index-chart/lib/zones-primitive.ts",
      "components/voraui/fear-greed-index-chart/lib/index-tooltip.ts",
    ]);
  });

  it("throws for an unknown item name", () => {
    expect(() => getRegistryItem("does-not-exist")).toThrow(
      'No registry item named "does-not-exist"',
    );
  });
});

describe("readRegistryFile", () => {
  it("reads the real contents of a registry source file", () => {
    const content = readRegistryFile("registry/voraui/fear-greed-gauge/hooks/use-fear-greed.ts");
    expect(content).toContain("export function useFearGreed");
  });
});
