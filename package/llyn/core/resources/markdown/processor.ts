import { marked } from "marked";
import * as yaml from "@std/yaml";
import * as v from "valibot";
import * as parse5Dom from "parse5-dom";
import * as parse5 from "parse5";
import * as path from "@std/path";
import * as fs from "@std/fs";

import { Context as ProcessorContext } from "../../processor.ts";
import { Frontmatter, FrontmatterSchema } from "../../types.ts";
import { decomposeExtension } from "../../util/path.ts";

marked.use({ async: true, gfm: true });

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

export async function markdownProcessor(
  file: URL,
  templateFile: URL,
  ctx: ProcessorContext,
): Promise<void> {
  const filePath = file.pathname;
  const rootPath = ctx.root.pathname;
  const staticDistPath = ctx.staticDist.pathname;
  const outPath = decomposeExtension(path.join(
    staticDistPath,
    path.relative(rootPath, filePath),
  ))[0] + ".html";

  const [rawMarkdownContent, templateContent] = await Promise.all([
    Deno.readTextFile(file),
    Deno.readTextFile(templateFile),
  ]);
  const { body: markdownContent, frontmatter } = await parseDocument(
    rawMarkdownContent,
  );
  if (!frontmatter) {
    throw Error("Frontmatter is required");
  }

  const markdownDoc = parse5.parse(markdownContent);
  const templateDoc = parse5.parse(templateContent);

  await ctx.process["html-node"](file, markdownDoc, ctx);
  await ctx.process["html-node"](templateFile, templateDoc, ctx);

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

  const htmlNodes = [
    `<title>${frontmatter.title}</title>`,
    `<meta property="og:title" content="${frontmatter.title}">`,
    `<meta name="twitter:title" content="${frontmatter.title}">`,
    ...Object.entries(frontmatter.og ?? {}).map(
      ([key, value]) => `<meta property="og:${key}" content="${value}">`,
    ),
  ].join("\n");
  parse5Dom.appendNodesTo(
    header,
    ...parse5.parseFragment(htmlNodes).childNodes,
  );

  await fs.ensureDir(path.dirname(outPath));
  await Deno.writeTextFile(outPath, parse5.serialize(templateDoc));
}
