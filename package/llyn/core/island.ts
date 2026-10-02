import * as path from "@std/path";

import { Island } from "./types.ts";

export async function generateIslandId(specifier: string): Promise<string> {
  const input = new TextEncoder().encode(specifier);
  const digest = await crypto.subtle.digest("SHA-1", input);
  return new Uint8Array(digest).toHex().slice(0, 8);
}

export async function createIsland(root: URL, url: URL): Promise<Island> {
  const specifier = path.normalize(
    path.relative(path.fromFileUrl(root), path.fromFileUrl(url)),
  ).replaceAll(path.SEPARATOR, "/");
  return {
    id: await generateIslandId(specifier),
    specifier,
    url,
  };
}
