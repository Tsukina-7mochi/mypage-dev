import { Island } from "./types.ts";
import { IdProvider } from "./idProvider.ts";
import {
  htmlFileProcessor,
  htmlNodeProcessor,
} from "./resources/html/processor.ts";
import { markdownProcessor } from "./resources/markdown/processor.ts";
import {
  clientIslandProcessor,
  serverIslandProcessor,
} from "./resources/island/processor.ts";
import { buildAssetProcessor } from "./resources/buildAsset/processor.ts";

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
  liveReload: boolean;
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
