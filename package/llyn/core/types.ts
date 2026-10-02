import * as v from "valibot";

export type Island = {
  id: string;
  specifier: string;
  url: URL;
};

export type IslandKind = "client" | "server" | "static";

export type IslandInstance = {
  island: Island;
  kind: IslandKind;
  domId: string;
  props: Record<string, string>;
};

export const FrontmatterSchema = v.object({
  title: v.string(),
  createdAt: v.date(),
  updatedAt: v.date(),
  og: v.optional(v.record(v.string(), v.string())),
});
export type Frontmatter = v.InferOutput<typeof FrontmatterSchema>;

export type DocumentEntry =
  | { type: "html"; path: URL }
  | { type: "markdown"; path: URL; template: URL };
