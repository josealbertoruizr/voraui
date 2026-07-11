import { describe, expect, it } from "vitest";
import { getRegistryItem, readRegistryFile } from "@/lib/registry";

describe("getRegistryItem", () => {
  it("returns the fear-greed-gauge item with its real files, dependencies, and registry dependencies", () => {
    const item = getRegistryItem("fear-greed-gauge");
    expect(item.title).toBe("Fear & Greed Gauge");
    expect(item.dependencies).toEqual(["@number-flow/react"]);
    expect(item.registryDependencies).toEqual(["utils"]);
    expect(item.files).toEqual([
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge/fear-greed-gauge.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-gauge-skeleton.tsx",
        type: "registry:component",
        target: "components/voraui/fear-greed-gauge/fear-greed-gauge-skeleton.tsx",
      },
      {
        path: "registry/voraui/fear-greed-gauge/use-fear-greed.ts",
        type: "registry:hook",
        target: "components/voraui/fear-greed-gauge/use-fear-greed.ts",
      },
      {
        path: "registry/voraui/fear-greed-gauge/fear-greed-bands.ts",
        type: "registry:lib",
        target: "components/voraui/fear-greed-gauge/fear-greed-bands.ts",
      },
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
    const content = readRegistryFile("registry/voraui/fear-greed-gauge/use-fear-greed.ts");
    expect(content).toContain("export function useFearGreed");
  });
});
