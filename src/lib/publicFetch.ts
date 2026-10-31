import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isSafePublicUrl } from "@/lib/security";

/** Bounded web-page GET with validated redirects and pinned public DNS addresses. */
export async function fetchPublicPage(input: string, timeoutMs = 10_000): Promise<Response> {
  const signal = AbortSignal.timeout(timeoutMs);
  let url = new URL(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (!isSafePublicUrl(url.href)) throw new Error("URL must resolve to a public web address");
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await lookup(hostname, { all: true });
    if (!addresses.length || addresses.some(({ address, family }) => !isSafePublicUrl(`https://${family === 6 ? `[${address}]` : address}`))) {
      throw new Error("URL resolves to a non-public address");
    }
    signal.throwIfAborted();
    const address = addresses[0];
    const response = await new Promise<Response>((resolve, reject) => {
      const request = url.protocol === "https:" ? httpsRequest : httpRequest;
      const req = request(url, {
        signal,
        agent: false,
        // Prevent DNS rebinding between validation and connecting. TLS still verifies the hostname.
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
        headers: { "User-Agent": "HHJobCopilot/1.0", Accept: "text/html,application/xhtml+xml", "Accept-Encoding": "identity" },
      }, (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2_000_000) {
            res.destroy(new Error("Web page exceeds the 2 MB limit"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("error", reject);
        res.on("end", () => {
          const headers = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
            else if (value !== undefined) headers.set(key, value);
          }
          const status = res.statusCode ?? 502;
          if (status < 200 || status > 599) {
            reject(new Error("Invalid web response status"));
            return;
          }
          resolve(new Response([204, 205, 304].includes(status) ? null : new Uint8Array(Buffer.concat(chunks)), { status, headers }));
        });
      });
      req.on("error", reject);
      req.end();
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) return response;
    url = new URL(location, url);
  }
  throw new Error("Too many redirects");
}
