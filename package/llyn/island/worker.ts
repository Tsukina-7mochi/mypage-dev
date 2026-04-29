import * as path from "@std/path";

export type Island = {
  id: string;
  path: string;
  props: Record<string, string>;
};

export function renderWorkerFragment(island: Island): string {
  return `
import("${island.path}").then(({ default: component }) => {
  islands["${island.id}"] = React.createElement(component, ${JSON.stringify(island.props)});
});
  `;
}

export async function renderWorker(fragments: string[]): Promise<string> {
  const templatePath = path.resolve(
    path.dirname(import.meta.filename ?? ""),
    "./workerTemplate.ts",
  );
  const template = await Deno.readTextFile(templatePath);

  return [template, ...fragments].join("\n");
}
