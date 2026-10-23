# dev.ts7m.net

This is a personal website built on Llyn, an internal island-architecture
framework written in Deno and targeting Cloudflare Workers.

## Commands

- `deno task build`: build for production (`dist/worker.js` and `dist/static/`)
- `deno task dev`: rebuild with live reload on changes and serve
  `dist/worker.js` (`build.ts --dev`)
- `deno task serve`: serve the production dist
- `deno task clean`: clean dist
- `deno task test`: run tests with the required permissions
- `deno check`: run type checker
- `deno fmt`: run formatter

## Architecture

- `routes/`: site documents and islands (Llyn `root`)
  - `blog/`: blog contents (`*.md`) and templates (`.html`)
  - `index.html`: main page
  - `*.tsx`: islands referenced from documents
  - `public/`: files copied to `dist/static/public/`
- `src/`: server code
  - `main.ts`: worker entry point
  - `api/`: API routes
  - `static.ts`: static file route for Deno
- `build.ts`: build script (dev mode watches files and runs the server)
- `package/`: internal packages
  - `llyn`: island-architecture web framework
  - `parse5-dom`: dom manipulation tool for parse5
- `llyn.config.ts`: Llyn configuration
- `deno.json`: deno manifest file
- `dist/`: build output directory (deployed)
  - `worker.js`: worker entry
  - `static/`: static assets

## Resources

- See @./package/llyn/readme.md when editing files in `routes/` or `src/`.
