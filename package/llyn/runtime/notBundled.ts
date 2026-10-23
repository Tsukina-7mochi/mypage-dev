export function notBundled(name: string): never {
  throw new Error(`${name} is only available in a worker bundled by llyn`);
}
