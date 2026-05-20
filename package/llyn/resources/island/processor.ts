import { prerenderClientIsland, prerenderServerIsland } from "./prerender.ts";
import { Context as ProcessorContext } from "../../processor.ts";
import { Island } from "../../types.ts";

export async function clientIslandProcessor(
  island: Island,
  _: ProcessorContext,
): Promise<{ prerender: string }> {
  const prerendered = await prerenderClientIsland(island);
  return { prerender: prerendered };
}

export async function serverIslandProcessor(
  island: Island,
  _: ProcessorContext,
): Promise<{ prerender: string }> {
  const prerendered = await prerenderServerIsland(island);
  return { prerender: prerendered };
}
