import * as fs from "@std/fs";
import * as path from "@std/path";

import { getStaticDist, ResolvedLlynConfig } from "./config.ts";

export async function copyPublic(config: ResolvedLlynConfig): Promise<void> {
  if (!config.public) return;

  const staticDist = getStaticDist(config);
  const publicPath = path.fromFileUrl(config.public);
  const destination = path.join(
    path.fromFileUrl(staticDist),
    path.basename(path.resolve(publicPath)),
  );
  await fs.ensureDir(destination);
  await fs.copy(publicPath, destination, { overwrite: true });
}
