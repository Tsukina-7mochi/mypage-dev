import * as v from "valibot";

export type Island = {
  id: string;
  url: URL;
  props: Record<string, string>;
};

export const DocumentEntrySchema = v.union([
  v.string(),
  v.object({
    type: v.literal("html"),
    path: v.string(),
  }),
  v.object({
    type: v.literal("markdown"),
    path: v.string(),
    template: v.string(),
  }),
]);

export const BuildOptionsSchema = v.object({
  dev: v.optional(v.boolean(), false),
  entries: v.object({
    documents: v.array(DocumentEntrySchema),
    worker: v.string(),
  }),
  root: v.string(),
  dist: v.string(),
});

export type BuildOptions = v.InferInput<typeof BuildOptionsSchema>;
export type ParsedBuildOptions = v.InferOutput<typeof BuildOptionsSchema>;
