import * as path from 'std/path/mod.ts';
import { readLines } from 'std/io/mod.ts';
import { Command } from 'cliffy';
import * as esbuild from 'esbuild';
import copyPlugin from 'esbuild-plugin-copy';
import esbuildCachePlugin from 'esbuild-plugin-cache';
import resultPlugin from 'esbuild-plugin-result';
import sassPlugin from 'esbuild-plugin-sass';
import htmlTemplatePlugin from './plugins/htmlTemplatePlugin.ts';
import liveReloadPlugin from './plugins/liveReloadPlugin.ts';

const srcPath = path.resolve('./src');
const destPath = path.resolve('./dist');

const lockMap = JSON.parse(await Deno.readTextFile('./deno.lock'));
const importMap = JSON.parse(await Deno.readTextFile('./import_map.json'));
const cacheDir = await esbuildCachePlugin.util.getDenoDir();

const buildOptions = (dev = false): esbuild.BuildOptions => ({
  entryPoints: [
    path.join(srcPath, 'main.ts'),
    path.join(srcPath, 'index.html'),
    path.join(srcPath, 'style.scss'),
  ],
  bundle: true,
  outdir: destPath,
  platform: 'browser',
  plugins: [
    esbuildCachePlugin({
      denoCacheDirectory: cacheDir,
      lockMap,
      importMap,
    }),
    sassPlugin(),
    copyPlugin({
      baseDir: srcPath,
      baseOutDir: destPath,
      files: [
        { from: 'imgs/*', to: 'imgs/[name][ext]' },
      ],
    }),
    resultPlugin(),
    htmlTemplatePlugin({
      root: './src/contents',
    }),
    liveReloadPlugin({
      enabled: dev,
    }),
  ],
  sourcemap: dev ? 'inline' : 'linked',
  minify: !dev,
});

const { options } = await new Command()
  .option('-d, --dev', 'development mode')
  .option('-w, --watch', 'watch mode')
  .option('-s, --serve', 'serve mode')
  .parse(Deno.args);

const config = buildOptions(options.dev);

if (!(options.watch || options.serve)) {
  await esbuild.build(config);
  Deno.exit();
}

const ctx = await esbuild.context(config);
await ctx.watch();
console.log('Watching...');

if (options.serve) {
  const { host, port } = await ctx.serve({
    servedir: config.outdir,
  });
  console.log(`Serving on ${host}:${port}`);
}

for await (const _ of readLines(Deno.stdin)) {
  // manually rebuild
  await ctx.rebuild().catch(() => {});
}

esbuild.stop();
