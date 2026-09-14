import {
  prerenderClientIsland,
  prerenderServerIsland,
  prerenderStaticIsland,
} from "./prerender.ts";
import { Context as ProcessorContext } from "../../processor.ts";
import { IslandInstance } from "../../types.ts";

export async function clientIslandProcessor(
  instance: IslandInstance,
  _: ProcessorContext,
): Promise<{ prerender: string }> {
  const prerendered = await prerenderClientIsland(instance);
  return { prerender: prerendered };
}

export async function serverIslandProcessor(
  instance: IslandInstance,
  _: ProcessorContext,
): Promise<{ prerender: string }> {
  const prerendered = await prerenderServerIsland(instance);
  return { prerender: prerendered };
}

export async function staticIslandProcessor(
  instance: IslandInstance,
  _: ProcessorContext,
): Promise<{ prerender: string }> {
  const prerendered = await prerenderStaticIsland(instance);
  return { prerender: prerendered };
}
