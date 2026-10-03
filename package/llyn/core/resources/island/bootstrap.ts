import * as path from "@std/path";
import { IslandInstance } from "../../island.ts";

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
