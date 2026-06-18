# dev.ts7m.net

This is a personal website built on Llyn, an internal island-architecture
framework written in Deno and targeting Cloudflare Workers.

## Commands

- `deno task build`: build for production
- `deno task dev`: start dev server
- `deno task server`: serve the production dist
- `deno task clean`: clean dist
- `deno check`: run type checker
- `deno fmt`: run formatter

## Architecture

- `src/`: site source
  - `blog/`: blog contents (`*.md`) and templates (`.html`)
  - `index.html`: main page
  - `common.css`: common css file
  - `worker.ts`: worker entry point
- `package/`: internal packages
  - `llyn`: island-architecture web framework
  - `parse5-dom`: dom manipulation tool for parse5
- `build.ts`: build entry
- `deno.json`: deno manifest file
- `dist/`: build output directory
  - `worker.js`: worker entry
  - `static/`: static assets

## Resources

- See @./package/llyn/readme.md when editing files in `src/`.
