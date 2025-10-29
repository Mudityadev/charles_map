import { prisma } from "@/lib/db/client";

export interface OrgFlagsResult {
  orgId: string;
  planTier: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  features: string[];
}

const tierFeatures: Record<OrgFlagsResult["planTier"], string[]> = {
  BASIC: ["draw", "snap-to-grid"],
  STANDARD: ["draw", "snap-to-grid", "collaboration", "comments"],
  PREMIUM: ["draw", "snap-to-grid", "collaboration", "comments", "analytics", "timeline", "advanced-projections"],
  ENTERPRISE: [
    "draw",
    "snap-to-grid",
    "collaboration",
    "comments",
    "analytics",
    "timeline",
    "advanced-projections",
    "enterprise-admin"
  ]
};

export async function getOrgFlags(orgId: string): Promise<OrgFlagsResult> {
  const org = await prisma.org.findFirst({ where: { id: orgId } });
  const planTier = org?.planTier ?? "BASIC";
  const featureFlagsRaw = org?.featureFlags as { enabled?: unknown } | null;
  const featureFlags = Array.isArray(featureFlagsRaw?.enabled)
    ? (featureFlagsRaw?.enabled as string[])
    : [];
  const features = Array.from(new Set([...(tierFeatures[planTier] ?? []), ...featureFlags]));
  return {
    orgId,
    planTier,
    features
  };
}
