import { Download, ChevronRight } from "lucide-react";
import { getRegistryItem, readRegistryFile, type RegistryItem } from "@/lib/registry";
import { CodeBlock } from "@/components/site/code-block";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function langForFile(filePath: string): string {
  return filePath.endsWith(".tsx") ? "tsx" : "ts";
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

/** Nested tree from target paths, preserving registry file order. */
function buildTree(paths: string[][]): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (const segments of paths) {
    let level = nodes;
    for (const [i, segment] of segments.entries()) {
      const isDir = i < segments.length - 1;
      let node = level.find((n) => n.name === segment && Boolean(n.children) === isDir);
      if (!node) {
        node = isDir ? { name: segment, children: [] } : { name: segment };
        level.push(node);
      }
      if (node.children) level = node.children;
    }
  }
  return nodes;
}

function treeLines(nodes: TreeNode[], prefix: string): string[] {
  return nodes.flatMap((node, i) => {
    const isLast = i === nodes.length - 1;
    const line = `${prefix}${isLast ? "└──" : "├──"} ${node.name}${node.children ? "/" : ""}`;
    const childPrefix = `${prefix}${isLast ? "    " : "│   "}`;
    return node.children ? [line, ...treeLines(node.children, childPrefix)] : [line];
  });
}

function FolderTree({ item }: { item: RegistryItem }) {
  const [root] = buildTree(item.files.map((f) => f.target.split("/")));
  const lines = [`${root.name}/`, ...treeLines(root.children ?? [], "")];
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
      {lines.join("\n")}
    </pre>
  );
}

export async function ManualInstall({ name }: { name: string }) {
  const item = getRegistryItem(name);
  const deps = item.dependencies ?? [];
  const extraRegistryDeps = (item.registryDependencies ?? []).filter((d) => d !== "utils");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-medium">1. Install the following dependencies:</p>
        {deps.length > 0 ? (
          <CodeBlock code={`npm install ${deps.join(" ")}`} lang="bash" filename="Terminal" />
        ) : (
          <p className="text-sm text-muted-foreground">No external npm dependencies.</p>
        )}
        {extraRegistryDeps.length > 0 && (
          <p className="text-sm text-muted-foreground">
            This component also expects the shadcn/ui {extraRegistryDeps.map((d) => `\`${d}\``).join(", ")}{" "}
            primitive{extraRegistryDeps.length > 1 ? "s" : ""} - add {extraRegistryDeps.length > 1 ? "them" : "it"}{" "}
            with{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              npx shadcn@latest add {extraRegistryDeps.join(" ")}
            </code>{" "}
            if you don&apos;t already have {extraRegistryDeps.length > 1 ? "them" : "it"}.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-medium">2. Download the component:</p>
        <a
          href={`/d/${name}.zip`}
          download
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Download {name}.zip
        </a>
      </div>

      <div className="space-y-2">
        <p className="font-medium">
          3. Extract it, then copy{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            components/voraui/{name}/
          </code>{" "}
          into your project:
        </p>
        <FolderTree item={item} />
      </div>

      <div className="space-y-2">
        <p className="font-medium">4. Update the import paths:</p>
        <p className="text-sm text-muted-foreground">
          The files import from{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/lib/utils</code> and{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/components/ui/*</code>. Adjust
          those to match your own project&apos;s path aliases if they differ.
        </p>
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" aria-hidden />
          View source ({item.files.length} files)
        </summary>
        <div className="mt-4 space-y-4">
          {item.files.map((file) => (
            <CodeBlock
              key={file.path}
              code={readRegistryFile(file.path)}
              lang={langForFile(file.path)}
              filename={file.target}
            />
          ))}
        </div>
      </details>
    </div>
  );
}
