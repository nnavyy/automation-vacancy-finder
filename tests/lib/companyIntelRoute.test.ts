import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ crawl: vi.fn(), findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn() }));
vi.mock("@/lib/auth-helpers", () => ({ getApiUser: async () => ({ id: "paid-user" }) }));
vi.mock("@/lib/companyIntel", () => ({ crawlDeepCompanyIntel: mocks.crawl }));
vi.mock("@/lib/db", () => ({ default: { companyIntel: { findFirst: mocks.findFirst, update: mocks.update }, companyContact: { deleteMany: mocks.deleteMany } } }));
import { POST } from "@/app/api/company-intel/search/route";
function request(body: unknown): NextRequest { return new NextRequest("http://localhost/api/company-intel/search", { method: "POST", body: JSON.stringify(body) }); }
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("COMPANY_INTEL_USER_IDS", "paid-user"); });

describe("Company Intel refresh", () => {
  it("rejects a missing or unowned intel ID before crawling", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await POST(request({ intelId: "another-users-record" }));
    expect(response.status).toBe(404);
    expect(mocks.crawl).not.toHaveBeenCalled();
  });
  it("replaces contacts in one atomic nested write", async () => {
    mocks.findFirst.mockResolvedValue({ id: "intel-1", companyName: "Example", domain: "example.com" });
    mocks.crawl.mockResolvedValue({ domain: "example.com", contacts: [], description: "Updated" });
    mocks.update.mockResolvedValue({ id: "intel-1" });
    const response = await POST(request({ companyName: "Example" }));
    expect(response.status).toBe(200);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ contacts: { deleteMany: {}, create: [] } }) }));
  });
});
