import * as path from "@std/path";
import { IslandInstance } from "../../types.ts";

function rendererTemplate(instance: IslandInstance): string {
  return `
import("${instance.island.url}").then(({ default: component }) => {
  islands["${instance.domId}"] = React.createElement(component, ${
    JSON.stringify(instance.props)
  });
});
  `;
}

export async function renderServerRenderer(
  islands: IslandInstance[],
): Promise<string> {
  const templatePath = path.resolve(
    path.dirname(import.meta.filename ?? ""),
    "./serverRendererTemplate.ts",
  );
  const template = await Deno.readTextFile(templatePath);

  return [template, ...islands.map(rendererTemplate)].join("\n");
}
