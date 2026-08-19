import * as fs from "@std/fs";
import * as path from "@std/path";
import * as yaml from "@std/yaml";
import * as v from "valibot";

type BlogEntry = {
  title: string;
  updatedAt: Date;
  href: string;
};

export const FrontmatterSchema = v.looseObject({
  title: v.string(),
  updatedAt: v.date(),
});
type Frontmatter = v.InferOutput<typeof FrontmatterSchema>;

function readFrontmatter(content: string, filePath: string): Frontmatter {
  const match = content.match(/^-{3,}\n([\s\S]*?)\n-{3,}/);
  if (match === null) {
    throw new Error(`Frontmatter is required: ${filePath}`);
  }

  const frontmatterString = match[1].trim();
  const frontmatter = v.parse(FrontmatterSchema, yaml.parse(frontmatterString));

  return frontmatter;
}

async function collectBlogEntries(): Promise<BlogEntry[]> {
  const entries: BlogEntry[] = [];
  const blogDirectory = path.dirname(path.fromFileUrl(import.meta.url));

  for await (
    const entry of fs.walk(blogDirectory, {
      maxDepth: 1,
      includeDirs: false,
      exts: [".md"],
    })
  ) {
    if (entry.name === "index.md") {
      continue;
    }

    const content = await Deno.readTextFile(entry.path);
    const frontmatter = readFrontmatter(content, entry.path);
    const basename = path.basename(entry.path, ".md");
    entries.push({
      ...frontmatter,
      href: `/blog/${encodeURIComponent(basename)}.html`,
    });
  }

  return entries.sort(
    (a, b) =>
      b.updatedAt.getTime() - a.updatedAt.getTime() ||
      a.href.localeCompare(b.href),
  );
}

export default async function BlogIndex() {
  const entries = await collectBlogEntries();

  return (
    <ul>
      {entries.map((entry) => (
        <li key={entry.href}>
          <a href={entry.href}>{entry.title}</a>
        </li>
      ))}
    </ul>
  );
}
