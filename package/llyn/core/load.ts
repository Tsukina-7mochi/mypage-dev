import { Context } from "./context.ts";
import { DocumentEntry } from "./collect.ts";
import { LoadedDocument } from "./document.ts";
import { loadHtml } from "./resources/html/load.ts";
import { loadMarkdown } from "./resources/markdown/load.ts";

function loadDocument(
  entry: DocumentEntry,
  ctx: Context,
): Promise<LoadedDocument> {
  switch (entry.type) {
    case "html":
      return loadHtml(entry.path, ctx);
    case "markdown":
      return loadMarkdown(entry.path, ctx);
    default:
      throw Error(
        `Unknown entry type: ${JSON.stringify(entry satisfies never)}`,
      );
  }
}

export function loadDocuments(
  entries: DocumentEntry[],
  ctx: Context,
): Promise<LoadedDocument[]> {
  return Promise.all(entries.map((entry) => loadDocument(entry, ctx)));
}
