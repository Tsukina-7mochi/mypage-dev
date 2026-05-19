import * as path from "@std/path";

export function decomposeExtension(pathname: string): [string, string] {
  const extname = path.extname(pathname);
  const name = pathname.slice(0, -extname.length);
  return [name, extname];
}

export function toFileUrl(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  return new URL(`file://${resolvedPath}`);
}

export function toDirectoryFileUrl(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  return new URL(`file://${resolvedPath}/`);
}
