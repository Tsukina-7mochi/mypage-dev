import * as v from "valibot";

export const FrontmatterSchema = v.object({
  title: v.string(),
  createdAt: v.date(),
  updatedAt: v.date(),
  og: v.optional(v.record(v.string(), v.string())),
  template: v.optional(v.string(), "template.html"),
});
export type Frontmatter = v.InferOutput<typeof FrontmatterSchema>;
