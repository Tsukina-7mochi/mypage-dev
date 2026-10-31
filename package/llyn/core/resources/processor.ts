import { Context } from "../context.ts";
import { DocumentOutput } from "../documentOutput.ts";
import { LoadedDocument } from "../load.ts";
import { writeDocument } from "../render.ts";
import { htmlNodeProcessor } from "./html/processor.ts";

export async function processDocument(
  doc: LoadedDocument,
  ctx: Context,
): Promise<DocumentOutput> {
  const output = await htmlNodeProcessor(doc.url, doc.document, ctx);
  await writeDocument(doc, ctx);
  return output;
}
