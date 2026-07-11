// Bundles each registry item's files into public/d/<name>.zip for the docs
// manual-install download. Runs as part of `pnpm build` / `pnpm registry:build`.
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";

const root = process.cwd();
const outDir = process.argv[2] ?? path.join(root, "public", "d");
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf-8"));

fs.mkdirSync(outDir, { recursive: true });

for (const item of registry.items) {
  const zip = new JSZip();
  for (const file of item.files) {
    // readFileSync throws on a missing source, failing the build loudly.
    zip.file(file.target, fs.readFileSync(path.join(root, file.path), "utf-8"));
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(path.join(outDir, `${item.name}.zip`), buffer);
  console.log(`  ${item.name}.zip (${item.files.length} files)`);
}
