import * as path from "@std/path";
import { Island } from "../types.ts";

function clientIslandBootstrap(island: Island): string {
  return `
import("${island.path}").then(({ default: component }) => {
  bootstrapClientIsland("${island.id}", component, ${
    JSON.stringify(island.props)
  })
});
  `;
}

function serverIslandBootstrap(island: Island): string {
  return `bootstrapServerIsland("${island.id}");`;
}

export async function renderBootstrap(
  clientIslands: Island[],
  serverIslands: Island[],
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
