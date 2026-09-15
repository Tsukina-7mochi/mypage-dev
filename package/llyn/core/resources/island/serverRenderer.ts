import * as path from "@std/path";
import { Island } from "../../types.ts";

const IMPORTS_MARKER = "/*{ llyn-imports }*/";
const SWITCH_CASES_MARKER = "/*{ llyn-switch-cases }*/";

function islandIdentifier(island: Island): string {
  return `Island_${island.id}`;
}

function importTemplate(island: Island): string {
  return `import ${islandIdentifier(island)} from ${
    JSON.stringify(island.url.href)
  };`;
}

function switchCaseTemplate(island: Island): string {
  return `    case ${JSON.stringify(island.id)}:
      return render(${islandIdentifier(island)}, props);`;
}

export async function renderServerRenderer(
  islands: Island[],
): Promise<string> {
  const templatePath = path.resolve(
    path.dirname(import.meta.filename ?? ""),
    "./serverRendererTemplate.ts",
  );
  const template = await Deno.readTextFile(templatePath);
  const uniqueIslands = [...new Map(
    islands.map((island) => [island.id, island]),
  ).values()];
  const imports = uniqueIslands.map(importTemplate).join("\n");
  const switchCases = uniqueIslands.map(switchCaseTemplate).join("\n");

  return template
    .replace(IMPORTS_MARKER, imports)
    .replace(SWITCH_CASES_MARKER, switchCases);
}
