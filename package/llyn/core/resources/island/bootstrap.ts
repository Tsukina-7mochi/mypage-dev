import * as path from "@std/path";
import { IslandInstance } from "../../types.ts";

function clientIslandBootstrap(instance: IslandInstance): string {
  return `
import("${instance.island.url}").then(({ default: component }) => {
  bootstrapClientIsland("${instance.domId}", component, ${
    JSON.stringify({ ...instance.props, _prerender: false })
  })
});
  `;
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

  return [
    template,
    ...clientIslands.map(clientIslandBootstrap),
    ...serverIslands.map(serverIslandBootstrap),
  ].join("\n");
}
