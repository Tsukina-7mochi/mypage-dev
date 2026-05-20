import React from "react";
import { renderToReadableStream } from "react-dom/server";

const islands: Record<string, React.ReactNode> = {};

export async function renderIsland(
  id: string,
): Promise<ReadableStream<string> | null> {
  if (!(id in islands)) {
    return null;
  }
  return await renderToReadableStream(islands[id]);
}
