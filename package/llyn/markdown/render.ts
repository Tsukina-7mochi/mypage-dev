import { marked } from "marked";
import * as yaml from "@std/yaml";
import * as v from "valibot";
import * as parse5 from "parse5";
import * as parse5Dom from "parse5-dom";

type Document = parse5.DefaultTreeAdapterTypes.Document;

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

function parseDocument(content: string): MarkdownDocument {
  const match = content.match(/^-{3,}\n([\s\S]*?)\n-{3,}/);
  if (match === null) {
    return { body: content.trim(), frontmatter: null };
  }

  const frontmatterString = match[1].trim();
  const frontmatter = v.parse(FrontmatterSchema, yaml.parse(frontmatterString));
  const body = content.slice(match[0].length).trim();
  return { body, frontmatter };
}

export async function render(
  path: string,
  templatePath: string,
): Promise<Document> {
  const [markdownContent, templateContent] = await Promise.all([
    Deno.readTextFile(path),
    Deno.readTextFile(templatePath),
  ]);
  const { body: content, frontmatter } = parseDocument(markdownContent);
  if (!frontmatter) {
    throw Error("Frontmatter is required");
  }

  const document = parse5.parse(templateContent);
  const main = parse5Dom.selectOne(document, { tag: "main" });
  if (!main) {
    throw Error("main not found");
  }
  const header = parse5Dom.selectOne(document, { tag: "head" });
  if (!header) {
    throw Error("head not found");
  }

  const titleHtml = `<title>${frontmatter.title}</title>`;
  const parsedContent = await marked.parse(content);

  parse5Dom.pushNodesTo(
    header,
    parse5.parseFragment(titleHtml).childNodes[0],
  );
  parse5Dom.pushNodesTo(
    main,
    ...parse5.parseFragment(parsedContent).childNodes,
  );

  return document;
}
