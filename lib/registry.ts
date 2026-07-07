import fs from "node:fs";
import path from "node:path";
import registryConfig from "@/registry.json";

export interface RegistryFile {
  path: string;
  type: string;
  target: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

export function getRegistryItem(name: string): RegistryItem {
  const item = (registryConfig.items as RegistryItem[]).find((i) => i.name === name);
  if (!item) {
    throw new Error(`No registry item named "${name}"`);
  }
  return item;
}

export function readRegistryFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");
}
