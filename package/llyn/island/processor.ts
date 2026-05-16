import {
  ClientIslandProcessor,
  Island,
  ProcessContext,
  ServerIslandProcessor,
} from "../types.ts";
import { prerender } from "./prerender.ts";

export const clientIslandProcessor = {
  type: "client-island",
  async process(
    island: Island,
    _: ProcessContext,
  ): Promise<{ prerender: string }> {
    const prerendered = await prerender(island);
    return { prerender: prerendered };
  },
} satisfies ClientIslandProcessor;

export const serverIslandProcessor = {
  type: "server-island",
  async process(
    island: Island,
    _: ProcessContext,
  ): Promise<{ prerender: string }> {
    const prerendered = await prerender(island);
    return { prerender: prerendered };
  },
} satisfies ServerIslandProcessor;
