export async function generateIslandId(specifier: string): Promise<string> {
  const input = new TextEncoder().encode(specifier);
  const digest = await crypto.subtle.digest("SHA-1", input);
  return new Uint8Array(digest).toHex().slice(0, 8);
}
