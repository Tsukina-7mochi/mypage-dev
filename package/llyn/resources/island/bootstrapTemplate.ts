import * as React from "react";
import { hydrateRoot } from "react-dom/client";

export type Props = Record<string, string>;

function bootstrapClientIsland(id: string, component: React.FC, props: Props) {
  const element = document.getElementById(id);
  if (!element) throw Error(`Element ${id} is not found`);

  const reactElement = React.createElement(component, props);
  hydrateRoot(element, reactElement);
  (async () => {})().catch((err) => {
    const error = new Error(`Failed to bootstrap island ${id}`, { cause: err });
    console.error(error);
  });
}

function bootstrapServerIsland(id: string) {
  const element = document.getElementById(id);
  if (!element) throw Error(`Element ${id} is not found`);

  (async () => {
    const res = await fetch(`/_islands/${id}`);
    if (!res.ok) {
      throw Error(
        `Failed to fetch server island ${id}: ${res.status} ${res.statusText}`,
      );
    }
    element.innerHTML = await res.text();
  })().catch((err) => {
    const error = new Error(`Failed to bootstrap island ${id}`, { cause: err });
    console.error(error);
  });
}
