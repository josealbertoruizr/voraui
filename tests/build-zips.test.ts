import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import JSZip from "jszip";
import registryConfig from "@/registry.json";

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "voraui-zips-"));

afterAll(() => fs.rmSync(outDir, { recursive: true, force: true }));

describe("scripts/build-zips.mjs", () => {
  it("produces one zip per registry item with the files at their target paths", async () => {
    execFileSync("node", ["scripts/build-zips.mjs", outDir], { cwd: process.cwd() });

    for (const item of registryConfig.items) {
      const zipPath = path.join(outDir, `${item.name}.zip`);
      const zip = await JSZip.loadAsync(fs.readFileSync(zipPath));
      const entries = Object.keys(zip.files).filter((f) => !zip.files[f].dir);
      expect(entries.sort()).toEqual(item.files.map((f) => f.target).sort());
    }
  });

  it("zips the real source contents", async () => {
    const zip = await JSZip.loadAsync(fs.readFileSync(path.join(outDir, "trading-chart.zip")));
    const source = await zip.file("components/voraui/trading-chart/trading-chart.tsx")!.async("string");
    expect(source).toContain("function TradingChart");
  });
});
