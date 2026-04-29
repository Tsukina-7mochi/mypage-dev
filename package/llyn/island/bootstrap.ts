import * as path from "@std/path";

export type ClientIsland = {
  id: string;
  path: string;
  props: Record<string, string>;
};
export type ServerIsland = {
  id: string;
};

function clientIslandBootstrap(island: ClientIsland): string {
  return `
import("${island.path}").then(({ default: component }) => {
  bootstrapClientIsland("${island.id}", component, ${JSON.stringify(island.props)})
});
  `;
}

function serverIslandBootstrap(island: ServerIsland): string {
  return `bootstrapServerIsland("${island.id}");`;
}

export async function renderBootstrap(
  clientIslands: ClientIsland[],
  serverIslands: ServerIsland[],
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
