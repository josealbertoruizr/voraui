import { highlightCode } from "@/lib/shiki";
import { shouldCollapse } from "@/lib/code-block";
import { CodeBlockShell } from "@/components/site/code-block-shell";

export async function CodeBlock({
  code,
  lang,
  filename,
}: {
  code: string;
  lang: string;
  filename: string;
}) {
  const html = await highlightCode(code, lang);
  return (
    <CodeBlockShell html={html} code={code} filename={filename} collapsible={shouldCollapse(code)} />
  );
}
