import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(_: Request, context: { params: { id: string } }) {
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id: context.params.id, orgId: user.orgId } });
  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }
  const layers = await prisma.layer.findMany({
    where: { projectId: project.id },
    orderBy: { sortOrder: "asc" }
  });
  return NextResponse.json(layers);
}
