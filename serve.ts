import { serveDir } from "@std/http/file-server";

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/_islands/")) {
      const islandWorker = (await import("./dist/worker.js")).default;
      return islandWorker.fetch(req);
    }

    return serveDir(req, {
      fsRoot: "./dist/static",
    });
  },
};
