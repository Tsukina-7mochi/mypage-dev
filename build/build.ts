import * as path from 'std/path/mod.ts';
import { Command } from 'cliffy';
import * as esbuild from 'esbuild';
import { TextLineStream } from '@std/streams';

import { buildOptions as javascriptBuildOptions } from './javascript.ts';
import { buildOptions as cssBuildOptions } from './css.ts';
import { buildOptions as htmlBuildOptions } from './html.ts';
import { buildOptions as assetsBuildOptions } from './assets.ts';

const srcPath = path.resolve('./src');
const destPath = path.resolve('./dist');

const { options } = await new Command()
  .option('-d, --dev', 'development mode')
  .option('-w, --watch', 'watch mode')
  .option('-s, --serve', 'serve mode')
  .parse(Deno.args);

const dev = options.dev === true;

const buildOptions = [
  javascriptBuildOptions({ srcPath, destPath, dev }),
  cssBuildOptions({ srcPath, destPath, dev }),
  htmlBuildOptions({ srcPath, destPath }),
  await assetsBuildOptions({ srcPath, destPath }),
];

if (!(options.watch || options.serve)) {
  await Promise.all(buildOptions.map((option) => esbuild.build(option)));
  Deno.exit();
}

const contexts = await Promise.all(
  buildOptions.map((option) => esbuild.context(option)),
);

await Promise.all(contexts.map((ctx) => ctx.watch()));
console.log('Watching...');

if (options.serve) {
  const { host, port } = await contexts[0].serve({
    servedir: destPath,
  });
  console.log(`Serving on ${host}:${port}`);
}

const lines = Deno.stdin.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());

for await (const _ of lines) {
  // rebuild
  await Promise.all(contexts.map((ctx) => ctx.rebuild().catch(() => {})));
}

await esbuild.stop();
