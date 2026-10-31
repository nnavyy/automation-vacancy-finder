import { PassThrough } from "node:stream";
import { EventEmitter } from "node:events";
import type { RequestOptions } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:http", () => ({ request: mocks.request }));
vi.mock("node:https", () => ({ request: mocks.request }));
import { fetchPublicPage } from "@/lib/publicFetch";

type Page = PassThrough & { statusCode: number; headers: Record<string, string> };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.lookup.mockResolvedValue([{ address: "93.184.215.14", family: 4 }]);
});

function respond(statusCode: number, headers: Record<string, string>, body = "Hello"): void {
  mocks.request.mockImplementationOnce((_url: URL, _options: RequestOptions, handler: (response: Page) => void) => {
    const request = new EventEmitter();
    return Object.assign(request, { end: () => {
      const response = Object.assign(new PassThrough(), { statusCode, headers });
      handler(response);
      response.end(body);
    } });
  });
}

describe("public page fetching", () => {
  it("blocks public hostnames resolving to private IPs before connecting", async () => {
    mocks.lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    await expect(fetchPublicPage("https://example.com")).rejects.toThrow("non-public");
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("rejects a redirect to a private IP", async () => {
    respond(302, { location: "http://169.254.169.254/latest/meta-data/" });
    await expect(fetchPublicPage("https://example.com")).rejects.toThrow("public web address");
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  it("pins the validated address for connecting while retaining the original URL", async () => {
    respond(200, {});
    const result = await fetchPublicPage("https://example.com/portfolio");
    expect(await result.text()).toBe("Hello");
    expect(mocks.request).toHaveBeenCalledWith(new URL("https://example.com/portfolio"), expect.objectContaining({ agent: false, lookup: expect.any(Function), signal: expect.any(AbortSignal) }), expect.any(Function));
    const options: RequestOptions = mocks.request.mock.calls[0][1];
    const callback = vi.fn();
    options.lookup?.("example.com", { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [{ address: "93.184.215.14", family: 4 }]);
  });

  it("caps response bodies", async () => {
    respond(200, {}, "a".repeat(2_000_001));
    await expect(fetchPublicPage("https://example.com")).rejects.toThrow("2 MB");
  });
});
