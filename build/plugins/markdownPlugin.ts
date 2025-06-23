import * as esbuild from 'esbuild';
import * as YAML from '@std/yaml';
import { marked } from 'marked';

export type MarkdownPluginOptions = {
  templatePath: string;
};

export const markdownPlugin = (
  options: MarkdownPluginOptions,
): esbuild.Plugin => ({
  name: 'markdown-plugin',
  setup(build) {
    let template: string | null = null;

    build.onStart(async () => {
      template = await Deno.readTextFile(options.templatePath);
    });

    build.onLoad({ filter: /\.md$/ }, async (args) => {
      if (!template) {
        throw Error('Template must be loaded.');
      }

      const document = await Deno.readTextFile(args.path);

      const [frontMatter, content] = processFrontMatter(document);
      const contentHTML = await marked.parse(content);

      let result = template.slice(0);
      result = result.replaceAll(/{{\s*contents\s*}}/g, contentHTML);
      for (const key in frontMatter) {
        const pattern = new RegExp(
          `{{\\s*${escapeRegexp(key)}\\s*}}`,
          'g',
        );
        result = result.replaceAll(pattern, String(frontMatter[key]));
      }

      return {
        contents: result,
        loader: 'copy',
        watchFiles: [options.templatePath],
      };
    });
  },
});

const escapeRegexp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function processFrontMatter(
  document: string,
): [Record<string, unknown>, string] {
  const beginMatch = document.match(/^-{3,}\n/);
  if (beginMatch === null) {
    return [{}, document];
  }

  const endMatch = document.slice(beginMatch[0].length).match(/^-{3,}\n/m);
  if (endMatch === null || !endMatch.index) {
    return [{}, document];
  }

  const frontMatterPart = document.slice(
    beginMatch[0].length,
    beginMatch[0].length + endMatch.index,
  );
  const content = document.slice(
    beginMatch[0].length + endMatch.index + endMatch[0].length,
  );

  const frontMatter = YAML.parse(frontMatterPart);
  if (typeof frontMatter !== 'object') {
    return [{}, document];
  }

  return [frontMatter, content];
}
