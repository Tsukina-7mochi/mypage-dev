import { notBundled } from "./notBundled.ts";

export function serveLiveReload(_req: Request): Response {
  notBundled("serveLiveReload");
}
