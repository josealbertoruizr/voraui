import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/site/code-block";
import { readRegistryFile } from "@/lib/registry";

/**
 * MagicUI-style demo block: a Preview tab with the live demo in a bordered
 * frame and a Code tab showing the demo file's full source (line numbers,
 * registry import highlighted), so usage can be copied verbatim.
 */
export async function DemoPreview({
  source,
  children,
}: {
  /** Repo-relative path to the demo source file, e.g. "components/site/trading-chart-demo.tsx". */
  source: string;
  children: React.ReactNode;
}) {
  const code = readRegistryFile(source);

  return (
    <Tabs defaultValue="preview">
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        <div className="rounded-xl border border-border p-4 md:p-6">{children}</div>
      </TabsContent>
      <TabsContent value="code">
        <CodeBlock
          code={code}
          lang="tsx"
          filename={source}
          lineNumbers
          highlightLinesMatching="@/registry/voraui/"
        />
      </TabsContent>
    </Tabs>
  );
}
