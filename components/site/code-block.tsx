import { highlightCode, type HighlightOptions } from "@/lib/shiki";
import { shouldCollapse } from "@/lib/code-block";
import { CodeBlockShell } from "@/components/site/code-block-shell";

export async function CodeBlock({
  code,
  lang,
  filename,
  lineNumbers,
  highlightLinesMatching,
}: {
  code: string;
  lang: string;
  filename: string;
} & HighlightOptions) {
  const html = await highlightCode(code, lang, { lineNumbers, highlightLinesMatching });
  return (
    <CodeBlockShell html={html} code={code} filename={filename} collapsible={shouldCollapse(code)} />
  );
}
