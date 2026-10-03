import { Context } from "../context.ts";
import { DocumentEntry } from "../collect.ts";
import { DocumentOutput } from "../documentOutput.ts";
import { htmlFileProcessor } from "./html/processor.ts";
import { markdownProcessor } from "./markdown/processor.ts";

export function processDocument(
  entry: DocumentEntry,
  ctx: Context,
): Promise<DocumentOutput> {
  switch (entry.type) {
    case "html":
      return htmlFileProcessor(entry.path, ctx);
    case "markdown":
      return markdownProcessor(entry.path, ctx);
    default:
      throw Error(
        `Unknown entry type: ${JSON.stringify(entry satisfies never)}`,
      );
  }
}
