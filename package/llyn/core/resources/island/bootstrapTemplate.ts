import * as React from "react";
import { createRoot } from "react-dom/client";

export type Props = Record<string, string>;

// deno-lint-ignore no-unused-vars -- Called by generated client-island bootstrap code.
function bootstrapClientIsland(
  id: string,
  component: React.ComponentType<Props & { _prerender: false }>,
  props: Props & { _prerender: false },
) {
  const element = document.getElementById(id);
  if (!element) throw Error(`Element ${id} is not found`);

  const reactElement = React.createElement(component, props);
  const root = createRoot(element);
  root.render(reactElement);
  (async () => {})().catch((err) => {
    const error = new Error(`Failed to bootstrap island ${id}`, { cause: err });
    console.error(error);
  });
}

// deno-lint-ignore no-unused-vars -- Called by generated server-island bootstrap code.
function bootstrapServerIsland(
  domId: string,
  islandId: string,
  props: Props,
) {
  const element = document.getElementById(domId);
  if (!element) throw Error(`Element ${domId} is not found`);

  (async () => {
    const search = new URLSearchParams(props).toString();
    const url = `/_islands/${islandId}${search ? `?${search}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw Error(
        `Failed to fetch server island ${islandId}: ${res.status} ${res.statusText}`,
      );
    }
    element.innerHTML = await res.text();
  })().catch((err) => {
    const error = new Error(`Failed to bootstrap island ${domId}`, {
      cause: err,
    });
    console.error(error);
  });
}
