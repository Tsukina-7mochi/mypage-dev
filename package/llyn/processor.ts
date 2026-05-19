import { Island } from "./types.ts";
import { IdProvider } from "./idProvider.ts";
import { htmlFileProcessor, htmlNodeProcessor } from "./html/processor.ts";
import { markdownProcessor } from "./markdown/processor.ts";
import {
  clientIslandProcessor,
  serverIslandProcessor,
} from "./island/processor.ts";
import { buildAssetProcessor } from "./buildAsset/processor.ts";

const processors = {
  "html": htmlFileProcessor,
  "html-node": htmlNodeProcessor,
  "markdown": markdownProcessor,
  "client-island": clientIslandProcessor,
  "server-island": serverIslandProcessor,
  "build-asset": buildAssetProcessor,
};
type TProcessors = typeof processors;

export type Context = {
  dev: boolean;
  root: URL;
  dist: URL;
  staticDist: URL;
  idProvider: IdProvider;
  process: TProcessors;
  registerSourceFile(input: string, output: string): void;
  registerVirtualFile(input: string, output: string, content: string): void;
  registerServerIsland(island: Island): void;
};

export function createContext(
  partialContext: Omit<Context, "process">,
): Context {
  return {
    ...partialContext,
    process: processors,
  };
}
