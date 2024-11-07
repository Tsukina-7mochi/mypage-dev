import * as esbuild from 'esbuild';
import * as path from 'std/path/mod.ts';
import { marked } from 'marked';

type HtmlTemplatePluginOptions = {
  root: string | null;
};

const escapeRegexp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const htmlTemplatePlugin = (
  options?: HtmlTemplatePluginOptions,
): esbuild.Plugin => ({
  name: 'html-template-plugin',
  setup(build) {
    const root = path.resolve(options?.root ?? '.');

    build.onLoad({ filter: /\.html$/ }, async (args) => {
      let contents = await Deno.readTextFile(args.path);
      const match = [...(contents.match(/{{[^}]+}}/g) ?? [])];
      const basenames = match
        .map((v) => v.slice(2, -2).trim());
      const filenames = basenames.map((filename) => path.join(root, filename));
      const fileContents = await Promise.all(
        filenames.map(async (filename) => {
          const content = await Deno.readTextFile(filename);
          return marked.parse(content);
        }),
      );

      for (let i = 0; i < filenames.length; i++) {
        const basename = basenames[i];
        const fileContent = fileContents[i];
        const pattern = new RegExp(
          `{{\\s+${escapeRegexp(basename)}\\s+}}`,
          'g',
        );
        contents = contents.replaceAll(pattern, fileContent);
      }

      return {
        contents,
        watchFiles: [args.path, ...filenames],
        loader: 'copy',
      };
    });
  },
});

export default htmlTemplatePlugin;
