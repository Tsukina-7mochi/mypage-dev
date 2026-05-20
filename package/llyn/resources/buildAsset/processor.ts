import * as path from "@std/path";

import { Context as ProcessorContext } from "../../processor.ts";
import { decomposeExtension } from "../../util/path.ts";

const extensionConversion = {
  ".ts": ".js",
  ".jsx": ".js",
  ".tsx": ".js",
  ".mjs": ".js",
  ".cjs": ".js",
};

export function buildAssetProcessor(
  url: URL,
  ctx: ProcessorContext,
): { outFile: URL } {
  const filepath = url.pathname;
  const rootPath = ctx.root.pathname;
  const staticDistPath = ctx.staticDist.pathname;
  const outPathPreExt = path.join(
    staticDistPath,
    path.relative(rootPath, filepath),
  );

  let outPath = outPathPreExt;
  const [outName, outExt] = decomposeExtension(outPathPreExt);
  if (outExt in extensionConversion) {
    outPath = outName +
      extensionConversion[outExt as keyof typeof extensionConversion];
  }

  ctx.registerSourceFile(filepath, outName);

  return { outFile: new URL(`file://${outPath}`) };
}
