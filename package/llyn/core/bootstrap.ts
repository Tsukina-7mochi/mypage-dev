import * as path from "@std/path";

import { VirtualFile } from "./entryPoint.ts";
import { IslandInstance } from "./island.ts";
import { CollectedDocument, LoadedDocument } from "./document.ts";
import { decomposeExtension } from "./util/path.ts";

export type BootstrapPaths = {
  // Virtual module name of the bootstrap.
  in: string;
  // Output path without extension.
  out: string;
  // Reference from the document.
  src: string;
};

function islandIdentifier(instance: IslandInstance): string {
  return `Island_${instance.island.id}`;
}

function clientIslandImport(instance: IslandInstance): string {
  return `import ${islandIdentifier(instance)} from ${
    JSON.stringify(instance.island.url.href)
  };`;
}

function clientIslandBootstrap(instance: IslandInstance): string {
  return `bootstrapClientIsland("${instance.domId}", ${
    islandIdentifier(instance)
  }, ${JSON.stringify({ ...instance.props, _prerender: false })});`;
}

function serverIslandBootstrap(instance: IslandInstance): string {
  return `bootstrapServerIsland("${instance.domId}", "${instance.island.id}", ${
    JSON.stringify(instance.props)
  });`;
}

export async function renderBootstrap(
  clientIslands: IslandInstance[],
  serverIslands: IslandInstance[],
): Promise<string> {
  const templatePath = path.resolve(
    path.dirname(import.meta.filename ?? ""),
    "./bootstrapTemplate.ts",
  );
  const template = await Deno.readTextFile(templatePath);

  const imports = [
    ...new Map(clientIslands.map((i) => [i.island.id, i])).values(),
  ].map(clientIslandImport);

  return [
    ...imports,
    template,
    ...clientIslands.map(clientIslandBootstrap),
    ...serverIslands.map(serverIslandBootstrap),
  ].join("\n");
}

export function bootstrapPaths(doc: LoadedDocument): BootstrapPaths {
  const [outName, _] = decomposeExtension(doc.outPath);
  const out = outName + "-bootstrap";
  return {
    in: `${doc.url.pathname}.bootstrap.ts`,
    out,
    src: path.relative(path.dirname(doc.outPath), out + ".js"),
  };
}

// A page needs a bootstrap only when it has islands to run on the client.
export function hasRuntimeIslands(doc: CollectedDocument): boolean {
  return doc.islands.some(({ instance }) =>
    instance.kind === "client" || instance.kind === "server"
  );
}

export function renderBootstraps(
  docs: CollectedDocument[],
): Promise<VirtualFile[]> {
  return Promise.all(
    docs.filter(hasRuntimeIslands).map(async (doc) => {
      const instances = doc.islands.map((island) => island.instance);
      const { in: input, out } = bootstrapPaths(doc);
      return {
        in: input,
        out,
        content: await renderBootstrap(
          instances.filter((instance) => instance.kind === "client"),
          instances.filter((instance) => instance.kind === "server"),
        ),
      };
    }),
  );
}
