import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn(), pool: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { searchPreference: mocks } }));
vi.mock("@/lib/vacancyPool", () => ({ getPoolVacancies: mocks.pool }));
vi.mock("@/lib/ruleFilter", () => ({ isProfileConfigured: () => true }));
import { runCollectionPipeline } from "@/lib/collectionPipeline";

it("does not start work when another run changed the profile lock after it was read", async () => {
  mocks.findFirst.mockResolvedValue({ id: "profile-1", collectionStatus: null });
  mocks.updateMany.mockResolvedValue({ count: 0 });
  const result = await runCollectionPipeline("user-1");
  expect(result.success).toBe(false);
  expect(result.error).toContain("already in progress");
  expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "profile-1", collectionStatus: expect.anything() }) }));
  expect(mocks.pool).not.toHaveBeenCalled();
});
