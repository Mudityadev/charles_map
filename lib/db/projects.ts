import { prisma } from "./client";

export async function getOrgProjects(orgId: string) {
  return prisma.project.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createProject(input: { orgId: string; name: string; description?: string; createdBy: string }) {
  return prisma.project.create({
    data: {
      orgId: input.orgId,
      name: input.name,
      description: input.description,
      createdBy: input.createdBy,
      updatedAt: new Date()
    }
  });
}

export async function getProjectById(id: string, orgId: string) {
  return prisma.project.findFirst({
    where: { id, orgId }
  });
}
