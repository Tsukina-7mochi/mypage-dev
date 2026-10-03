import * as path from "@std/path";

export type Island = {
  id: string;
  specifier: string;
  url: URL;
};

export type IslandKind = "client" | "server" | "static";

export type IslandInstance = {
  island: Island;
  kind: IslandKind;
  domId: string;
  props: Record<string, string>;
};

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

export function uniqueIslands(islands: Island[]): Island[] {
  const islandsById = islands.reduce((acc, island) => {
    const registered = acc.get(island.id);
    if (registered && registered.specifier !== island.specifier) {
      throw new Error(
        `Island ID collision: ${registered.specifier} and ${island.specifier}`,
      );
    }
    return registered ? acc : new Map([...acc, [island.id, island]]);
  }, new Map<string, Island>());
  return [...islandsById.values()];
}

export function uniqueServerIslands(instances: IslandInstance[]): Island[] {
  const serverIslandIds = new Set(
    instances
      .filter((instance) => instance.kind === "server")
      .map((instance) => instance.island.id),
  );
  return uniqueIslands(instances.map((instance) => instance.island)).filter(
    (island) => serverIslandIds.has(island.id),
  );
}
