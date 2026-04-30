import { serveDir } from "@std/http/file-server";
import * as path from "@std/path";
import * as llyn from "llyn/runtime";

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/_islands/")) {
      const id = pathname.slice(10);
      const island = await llyn.renderIsland(id);
      if (island === null) {
        return new Response("not found", { status: 404 });
      } else {
        return new Response(island);
      }
    }

    return serveDir(req, {
      fsRoot: path.join(import.meta.dirname ?? "", "static/"),
    });
  },
};
