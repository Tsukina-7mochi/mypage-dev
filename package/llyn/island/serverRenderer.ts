import * as path from "@std/path";
import { Island } from "../types.ts";

function rendererTemplate(island: Island): string {
  return `
import("${island.path}").then(({ default: component }) => {
  islands["${island.id}"] = React.createElement(component, ${
    JSON.stringify(island.props)
  });
});
  `;
}

export async function renderServerRenderer(islands: Island[]): Promise<string> {
  const templatePath = path.resolve(
    path.dirname(import.meta.filename ?? ""),
    "./serverRendererTemplate.ts",
  );
  const template = await Deno.readTextFile(templatePath);

  return [template, ...islands.map(rendererTemplate)].join("\n");
}
