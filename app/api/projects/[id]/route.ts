import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  mapStyleJson: z.any().optional()
});

export async function GET(_: Request, context: { params: { id: string } }) {
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id: context.params.id, orgId: user.orgId } });
  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.json(project);
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const user = await requireUser();
  const body = await request.json();
  const data = updateSchema.parse(body);
  const project = await prisma.project.update({
    where: { id: context.params.id, orgId: user.orgId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
  return NextResponse.json(project);
}
