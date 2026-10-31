import * as parse5 from "parse5";
import * as path from "@std/path";

import { Context } from "../../context.ts";
import { LoadedDocument } from "../../load.ts";

export async function loadHtml(
  url: URL,
  ctx: Context,
): Promise<LoadedDocument> {
  const filepath = url.pathname;
  const rootPath = ctx.root.pathname;
  const staticDistPath = ctx.staticDist.pathname;
  const outPath = path.join(staticDistPath, path.relative(rootPath, filepath));

  const rawContent = await Deno.readTextFile(url);
  const document = parse5.parse(rawContent);

  return { url, outPath, document };
}
