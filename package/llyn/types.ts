import { IdProvider } from "./idProvider.ts";
import * as parse5 from "parse5";

type Document = parse5.DefaultTreeAdapterTypes.Document;
type DocumentFragment = parse5.DefaultTreeAdapterTypes.DocumentFragment;

export type Island = {
  id: string;
  url: URL;
  props: Record<string, string>;
};

export type BuildOptions = {
  dev: boolean;
  entries: {
    documents: string[];
    worker: string;
  };
  root: string;
  dist: string;
  markdownTemplate: string;
};

export type ProcessContext = {
  options: {
    root: URL;
    dist: URL;
    staticDist: URL;
  };
  idProvider: IdProvider;
  registerSourceFile(input: string, output: string): void;
  registerVirtualFile(input: string, output: string, content: string): void;
  registerServerIsland(island: Island): void;
};

export type Processor<T extends string, I, O> = {
  type: T;
  process(input: I, ctx: ProcessContext): O;
};

export type HtmlFileProcessor = Processor<
  "html",
  URL,
  Promise<void>
>;
export type HtmlDocumentProcessor = Processor<
  "html-document",
  { url: URL; content: string },
  Promise<{ document: Document }>
>;
export type HtmlDocumentFragmentProcessor = Processor<
  "html-document-fragment",
  { url: URL; content: string },
  Promise<{ documentFragment: DocumentFragment }>
>;
export type MarkdownProcessor = Processor<
  "markdown",
  { file: URL; template: URL },
  Promise<void>
>;
export type ClientIslandProcessor = Processor<
  "client-island",
  Island,
  Promise<{ prerender: string }>
>;
export type ServerIslandProcessor = Processor<
  "server-island",
  Island,
  Promise<{ prerender: string }>
>;
export type BuildAssetProcessor = Processor<
  "build-asset",
  URL,
  { outFile: URL }
>;
