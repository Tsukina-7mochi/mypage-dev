import * as fs from "@std/fs";
import * as path from "@std/path";

import { ResolvedLlynConfig } from "./config.ts";
import { DocumentEntry } from "./types.ts";

export type CollectedDocumentEntry = Exclude<DocumentEntry, URL>;

function toDocumentEntry(file: URL): CollectedDocumentEntry {
  switch (path.extname(file.pathname)) {
    case ".html":
      return { type: "html", path: file };
    case ".md":
      return {
        type: "markdown",
        path: file,
        template: new URL("template.html", file),
      };
    default:
      throw new Error(`Unsupported document extension: ${file.pathname}`);
  }
}

export async function collectDocuments(
  config: ResolvedLlynConfig,
): Promise<CollectedDocumentEntry[]> {
  const entries = await Promise.all(
    config.documents.map((pattern) =>
      Array.fromAsync(fs.expandGlob(pattern, {
        root: path.fromFileUrl(config.root),
        exclude: config.documentsExclude,
        includeDirs: false,
      }))
    ),
  );
  return entries.flat().map((entry) =>
    toDocumentEntry(path.toFileUrl(entry.path))
  );
}

export async function collectIslandUrls(
  config: ResolvedLlynConfig,
): Promise<URL[]> {
  const entries = await Promise.all(
    config.islands.map((pattern) =>
      Array.fromAsync(fs.expandGlob(pattern, {
        root: path.fromFileUrl(config.root),
        exclude: config.islandsExclude,
        includeDirs: false,
      }))
    ),
  );
  return entries.flat().map((entry) => path.toFileUrl(entry.path));
}
