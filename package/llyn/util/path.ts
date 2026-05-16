import * as path from "@std/path";

export function decomposeExtension(pathname: string): [string, string] {
  const extname = path.extname(pathname);
  const name = pathname.slice(0, -extname.length);
  return [name, extname];
}
