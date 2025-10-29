import { describe, expect, it, vi, afterEach } from "vitest";
import { getOrgFlags } from "@/lib/flags/server";
import { prisma } from "@/lib/db/client";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("feature flags", () => {
  it("returns default features for missing org", async () => {
    vi.spyOn(prisma.org, "findFirst").mockResolvedValue(null as any);
    const result = await getOrgFlags("missing-org");
    expect(result.planTier).toBe("BASIC");
    expect(result.features).toContain("draw");
  });

  it("merges custom flags", async () => {
    vi.spyOn(prisma.org, "findFirst").mockResolvedValue({
      id: "org",
      planTier: "STANDARD",
      featureFlags: { enabled: ["beta"] }
    } as any);
    const result = await getOrgFlags("org");
    expect(result.features).toContain("beta");
    expect(result.planTier).toBe("STANDARD");
  });
});
