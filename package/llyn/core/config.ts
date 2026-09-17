import { exists } from "@std/fs";
import * as path from "@std/path";
import * as v from "valibot";

const DirectoryUrlSchema = v.pipe(
  v.string(),
  v.transform((filePath) => {
    const url = path.toFileUrl(path.resolve(filePath));
    if (!url.pathname.endsWith("/")) {
      url.pathname += "/";
    }
    return url;
  }),
);
const FileUrlSchema = v.pipe(
  v.string(),
  v.transform((filePath) => path.toFileUrl(path.resolve(filePath))),
);

export const LlynConfigSchema = v.object({
  root: DirectoryUrlSchema,
  dist: DirectoryUrlSchema,
  documents: v.array(v.string()),
  documentsExclude: v.optional(v.array(v.string()), []),
  islands: v.array(v.string()),
  islandsExclude: v.optional(v.array(v.string()), []),
  public: v.optional(DirectoryUrlSchema),
  worker: FileUrlSchema,
});

export type LlynConfig = v.InferInput<typeof LlynConfigSchema>;
export type ResolvedLlynConfig = v.InferOutput<typeof LlynConfigSchema>;

export function defineConfig<const T extends LlynConfig>(config: T): T {
  return config;
}

export async function loadConfig(): Promise<ResolvedLlynConfig> {
  const configPaths = [
    "./llyn.config.js",
    "./llyn.config.mjs",
    "./llyn.config.ts",
  ];

  for (const configPath of configPaths) {
    if (await exists(configPath, { isFile: true })) {
      const module = await import(
        path.toFileUrl(path.resolve(configPath)).href
      );
      return v.parse(LlynConfigSchema, module.default);
    }
  }

  throw new Error(`Config file not found: ${configPaths.join(", ")}`);
}
