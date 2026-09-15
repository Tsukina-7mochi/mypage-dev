export const isDev = true;

export function serveIsland(_req: Request): Response {
  throw new Error("serveIsland is not implemented for the dev runtime yet");
}

export function serveStaticForDev(_req: Request): Response {
  throw new Error("serveStaticForDev is not implemented yet");
}
