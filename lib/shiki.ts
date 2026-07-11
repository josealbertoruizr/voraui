import { codeToHtml } from "shiki";

export interface HighlightOptions {
  /** Render CSS-counter line numbers in the gutter. */
  lineNumbers?: boolean;
  /** Highlight every line containing this substring. */
  highlightLinesMatching?: string;
}

export async function highlightCode(
  code: string,
  lang: string,
  options: HighlightOptions = {},
): Promise<string> {
  const { lineNumbers = false, highlightLinesMatching } = options;
  const lines = code.split("\n");

  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    transformers: [
      {
        pre(node) {
          if (lineNumbers) this.addClassToHast(node, "line-numbers");
        },
        line(node, line) {
          if (highlightLinesMatching && lines[line - 1]?.includes(highlightLinesMatching)) {
            this.addClassToHast(node, "highlighted");
          }
        },
      },
    ],
  });
}
