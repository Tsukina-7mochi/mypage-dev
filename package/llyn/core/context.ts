import { IslandInstance } from "./types.ts";

export type Context = {
  dev: boolean;
  liveReload: boolean;
  root: URL;
  staticDist: URL;
};

export type SourceFile = {
  in: string;
  out: string;
};

export type VirtualFile = {
  in: string;
  out: string;
  content: string;
};

export type DocumentOutput = {
  sourceFiles: SourceFile[];
  virtualFiles: VirtualFile[];
  islands: IslandInstance[];
};

export function mergeDocumentOutputs(
  outputs: DocumentOutput[],
): DocumentOutput {
  return {
    sourceFiles: outputs.flatMap((output) => output.sourceFiles),
    virtualFiles: outputs.flatMap((output) => output.virtualFiles),
    islands: outputs.flatMap((output) => output.islands),
  };
}
