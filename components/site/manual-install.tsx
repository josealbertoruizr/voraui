import { getRegistryItem, readRegistryFile } from "@/lib/registry";
import { CodeBlock } from "@/components/site/code-block";

function langForFile(filePath: string): string {
  return filePath.endsWith(".tsx") ? "tsx" : "ts";
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
        <p className="font-medium">2. Copy the following files into your project:</p>
        <div className="space-y-4">
          {item.files.map((file) => (
            <CodeBlock
              key={file.path}
              code={readRegistryFile(file.path)}
              lang={langForFile(file.path)}
              filename={file.target}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium">3. Update the import paths:</p>
        <p className="text-sm text-muted-foreground">
          The files above import from{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/lib/utils</code> and{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@/components/ui/*</code>. Adjust
          those to match your own project&apos;s path aliases if they differ.
        </p>
      </div>
    </div>
  );
}
