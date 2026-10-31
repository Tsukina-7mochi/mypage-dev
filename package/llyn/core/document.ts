import * as parse5 from "parse5";

import { SourceFile } from "./entryPoint.ts";
import { IslandInstance } from "./island.ts";

type Document = parse5.DefaultTreeAdapterTypes.Document;
type Element = parse5.DefaultTreeAdapterTypes.Element;

export type LoadedDocument = {
  url: URL;
  outPath: string;
  document: Document;
};

export type ScannedIsland = {
  instance: IslandInstance;
  element: Element;
};

export type ScannedAsset = {
  element: Element;
  // Absolute path of the built asset, referenced from the document.
  reference: string;
  sourceFile: SourceFile;
};

export type CollectedDocument = LoadedDocument & {
  // Ordered by DOM ID index.
  islands: ScannedIsland[];
  scripts: ScannedAsset[];
  stylesheets: ScannedAsset[];
};
