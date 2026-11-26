import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon(): Promise<Response> {
  const favicon = await readFile(join(process.cwd(), "public", "favicon.png"));
  return new Response(new Uint8Array(favicon), { headers: { "Content-Type": contentType } });
}
