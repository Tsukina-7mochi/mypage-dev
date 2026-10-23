import * as path from "@std/path";

import { Island } from "../island.ts";
import { renderServerRenderer } from "./serverRenderer.ts";

const islandSource = `type Props = {
  _prerender: boolean;
  label?: string;
};

export default function TestIsland({ _prerender, label }: Props) {
  return (
    <p data-prerender={String(_prerender)}>
      {label}
    </p>
  );
}
`;

let temporaryDirectory: string;
let island: Island;

Deno.test.beforeEach(async () => {
  temporaryDirectory = await Deno.makeTempDir();
  const islandPath = path.join(temporaryDirectory, "island.tsx");
  await Deno.writeTextFile(islandPath, islandSource);
  island = {
    id: "1234abcd",
    specifier: "island.tsx",
    url: path.toFileUrl(islandPath),
  };
});

Deno.test.afterEach(async () => {
  await Deno.remove(temporaryDirectory, { recursive: true });
});

function countOccurrences(value: string, search: string): number {
  return value.split(search).length - 1;
}

Deno.test("server renderer emits one static import and switch case per island", async () => {
  const source = await renderServerRenderer([island, island]);

  if (countOccurrences(source, "import Island_1234abcd") !== 1) {
    throw new Error("Server island import was not deduplicated");
  }
  if (countOccurrences(source, 'case "1234abcd"') !== 1) {
    throw new Error("Server island switch case was not deduplicated");
  }
  if (source.includes("renderIsland")) {
    throw new Error("Generated runtime still exports renderIsland");
  }
});

Deno.test("generated serveIsland renders query props and handles unknown IDs", async () => {
  const source = await renderServerRenderer([island]);
  const moduleUrl = `data:application/typescript;charset=utf-8,${
    encodeURIComponent(source)
  }`;
  const runtime = await import(moduleUrl);

  if (await runtime.startDevBuild() !== undefined) {
    throw new Error("Generated startDevBuild must resolve to undefined");
  }
  if (runtime.serveLiveReload().status !== 404) {
    throw new Error("Generated serveLiveReload must return Not Found");
  }

  const response = await runtime.serveIsland(
    new Request(
      "https://example.test/_islands/1234abcd?label=runtime&_prerender=true",
    ),
  );
  if (response.status !== 200) {
    throw new Error(`Unexpected render status: ${response.status}`);
  }
  const body = await response.text();
  if (body !== '<p data-prerender="false">runtime</p>') {
    throw new Error(`Unexpected render body: ${body}`);
  }

  const notFound = await runtime.serveIsland(
    new Request("https://example.test/_islands/ffffffff"),
  );
  if (notFound.status !== 404 || await notFound.text() !== "Not Found") {
    throw new Error("Unknown island did not return Not Found");
  }
});

Deno.test("generated serveLiveReload sends the embedded boot id", async () => {
  const source = await renderServerRenderer([island], "boot-1234");
  const moduleUrl = `data:application/typescript;charset=utf-8,${
    encodeURIComponent(source)
  }`;
  const runtime = await import(moduleUrl);

  const response = runtime.serveLiveReload();
  if (response.headers.get("Content-Type") !== "text/event-stream") {
    throw new Error("Live reload must respond with an event stream");
  }
  const reader = response.body.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  const event = new TextDecoder().decode(value);
  if (event !== "event: boot\ndata: boot-1234\n\n") {
    throw new Error(`Unexpected live reload event: ${event}`);
  }
});
