import { marked } from "marked";
import * as yaml from "@std/yaml";
import * as v from "valibot";
import * as parse5Dom from "parse5-dom";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as fs from "@std/fs";

import {
  htmlDocumentFragmentProcessor,
  htmlDocumentProcessor,
} from "../html/processor.ts";
import { MarkdownProcessor, ProcessContext } from "../types.ts";
import { decomposeExtension } from "../util/path.ts";

marked.use({ async: true, gfm: true });

const FrontmatterSchema = v.object({
  title: v.string(),
  createdAt: v.date(),
  updatedAt: v.date(),
});
type Frontmatter = v.InferOutput<typeof FrontmatterSchema>;

type MarkdownDocument = {
  body: string;
  frontmatter: Frontmatter | null;
};

async function parseDocument(content: string): Promise<MarkdownDocument> {
  const match = content.match(/^-{3,}\n([\s\S]*?)\n-{3,}/);
  if (match === null) {
    return { body: content.trim(), frontmatter: null };
  }

  const frontmatterString = match[1].trim();
  const frontmatter = v.parse(FrontmatterSchema, yaml.parse(frontmatterString));
  const htmlBody = content.slice(match[0].length).trim();
  const body = await marked.parse(htmlBody);
  return { body, frontmatter };
}

export const markdownProcessor = {
  type: "markdown",
  async process(
    { file, template: templateFile }: { file: URL; template: URL },
    ctx: ProcessContext,
  ): Promise<void> {
    const filePath = file.pathname;
    const rootPath = ctx.options.root.pathname;
    const staticDistPath = ctx.options.staticDist.pathname;
    const outPath = decomposeExtension(path.join(
      staticDistPath,
      path.relative(rootPath, filePath),
    ))[0] + ".html";

    const [markdownContent, templateContent] = await Promise.all([
      Deno.readTextFile(file),
      Deno.readTextFile(templateFile),
    ]);
    const { body: content, frontmatter } = await parseDocument(markdownContent);
    if (!frontmatter) {
      throw Error("Frontmatter is required");
    }

    const markdownDoc = (await htmlDocumentFragmentProcessor.process({
      url: file,
      content: content,
    }, ctx)).documentFragment;
    const templateDoc = (await htmlDocumentProcessor.process({
      url: templateFile,
      content: templateContent,
    }, ctx)).document;

    const main = parse5Dom.selectOne(templateDoc, { tag: "main" });
    if (!main) {
      throw Error("main not found");
    }
    parse5Dom.appendNodesTo(
      main,
      ...markdownDoc.childNodes,
    );

    const header = parse5Dom.selectOne(templateDoc, { tag: "head" });
    if (!header) {
      throw Error("head not found");
    }
    const titleHtml = `<title>${frontmatter.title}</title>`;
    parse5Dom.appendNodesTo(
      header,
      parse5.parseFragment(titleHtml).childNodes[0],
    );

    await fs.ensureDir(path.dirname(outPath));
    await Deno.writeTextFile(outPath, parse5.serialize(templateDoc));
  },
} satisfies MarkdownProcessor;
