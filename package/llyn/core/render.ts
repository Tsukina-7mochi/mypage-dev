import * as fs from "@std/fs";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as htmlnano from "htmlnano";

import { Context } from "./context.ts";
import { LoadedDocument } from "./load.ts";

async function minifyHtml(html: string): Promise<string> {
  const result = await htmlnano.process(
    html,
    {
      minifyCss: false,
      minifyJs: false,
      minifySvg: false,
      skipConfigLoading: true,
      skipInternalWarnings: true,
    },
    htmlnano.presets.safe,
  );
  return result.html;
}

export async function writeDocument(
  doc: LoadedDocument,
  ctx: Context,
): Promise<void> {
  let content = parse5.serialize(doc.document);
  if (!ctx.dev) {
    content = await minifyHtml(content);
  }

  await fs.ensureDir(path.dirname(doc.outPath));
  await Deno.writeTextFile(doc.outPath, content);
}
