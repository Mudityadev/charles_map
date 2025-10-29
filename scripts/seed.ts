import { prisma } from "../lib/db/client";

async function main() {
  const tiers = ["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"] as const;
  for (const plan of tiers) {
    const org = await prisma.org.upsert({
      where: { name: `Demo ${plan}` },
      update: { planTier: plan as any },
      create: {
        name: `Demo ${plan}`,
        planTier: plan as any,
        seats: plan === "ENTERPRISE" ? 50 : plan === "PREMIUM" ? 25 : 10,
        featureFlags: { enabled: plan === "ENTERPRISE" ? ["enterprise-admin"] : [] }
      }
    });
    await prisma.user.upsert({
      where: { email: `${plan.toLowerCase()}@example.com` },
      update: { orgId: org.id },
      create: {
        email: `${plan.toLowerCase()}@example.com`,
        name: `${plan} User`,
        orgId: org.id,
        role: plan === "BASIC" ? "editor" : "admin"
      }
    });
    const project = await prisma.project.upsert({
      where: { id: `demo-project-${plan.toLowerCase()}` },
      update: { orgId: org.id },
      create: {
        id: `demo-project-${plan.toLowerCase()}`,
        orgId: org.id,
        name: `${plan} Project`,
        description: `Sample project for ${plan} plan`,
        mapStyleJson: {},
        createdBy: "seed",
        updatedAt: new Date()
      }
    });
    await prisma.layer.upsert({
      where: { id: `demo-layer-${plan.toLowerCase()}` },
      update: { projectId: project.id },
      create: {
        id: `demo-layer-${plan.toLowerCase()}`,
        projectId: project.id,
        orgId: org.id,
        name: "Sample layer",
        type: "vector",
        visibility: true,
        opacity: 1,
        sortOrder: 0
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
