import * as v from "valibot";
import * as pathUtil from "./util/path.ts";

export type Island = {
  id: string;
  url: URL;
  props: Record<string, string>;
};

const FileUrlSchema = v.pipe(
  v.string(),
  v.transform(pathUtil.toFileUrl),
);
const DirectoryFileUrlSchema = v.pipe(
  v.string(),
  v.transform(pathUtil.toDirectoryFileUrl),
);

export const DocumentEntrySchema = v.union([
  FileUrlSchema,
  v.object({
    type: v.literal("html"),
    path: FileUrlSchema,
  }),
  v.object({
    type: v.literal("markdown"),
    path: FileUrlSchema,
    template: FileUrlSchema,
  }),
]);

export const BuildOptionsSchema = v.object({
  dev: v.optional(v.boolean(), false),
  entries: v.object({
    documents: v.array(DocumentEntrySchema),
    worker: FileUrlSchema,
  }),
  root: DirectoryFileUrlSchema,
  dist: DirectoryFileUrlSchema,
});

export type BuildOptions = v.InferInput<typeof BuildOptionsSchema>;
export type ParsedBuildOptions = v.InferOutput<typeof BuildOptionsSchema>;

export const ServerOptionSchema = v.object({
  host: v.optional(v.string()),
  port: v.optional(v.number()),
});

export type ServerOptions = v.InferInput<typeof ServerOptionSchema>;
export type ParsedServerOptions = v.InferOutput<typeof ServerOptionSchema>;
