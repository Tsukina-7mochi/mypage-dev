import * as path from "@std/path";

import { Island } from "./types.ts";

export async function generateIslandId(specifier: string): Promise<string> {
  const input = new TextEncoder().encode(specifier);
  const digest = await crypto.subtle.digest("SHA-1", input);
  return new Uint8Array(digest).toHex().slice(0, 8);
}

export async function createIsland(root: URL, url: URL): Promise<Island> {
  const specifier = path.relative(
    path.fromFileUrl(root),
    path.fromFileUrl(url),
  ).replaceAll(path.SEPARATOR, "/");
  return {
    id: await generateIslandId(specifier),
    specifier,
    url,
  };
}

export function createIslandResolver(
  islands: Island[],
): (url: URL) => Promise<Island> {
  const islandsById = new Map<string, Island>();
  const islandsByUrl = new Map<string, Island>();

  for (const island of islands) {
    const registered = islandsById.get(island.id);
    if (registered && registered.specifier !== island.specifier) {
      throw new Error(
        `Island ID collision: ${registered.specifier} and ${island.specifier}`,
      );
    }
    islandsById.set(island.id, island);
    islandsByUrl.set(island.url.href, island);
  }

  // deno-lint-ignore require-await -- Island resolution has an async contract.
  return async (url) => {
    const island = islandsByUrl.get(url.href);
    if (!island) {
      throw new Error(`Island is not included in config: ${url.pathname}`);
    }
    return island;
  };
}
