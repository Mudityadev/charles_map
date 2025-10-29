import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/requireUser";

const updateSchema = z.object({
  geometry: z.any().optional(),
  properties: z.record(z.any()).optional()
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const user = await requireUser();
  const body = await request.json();
  const data = updateSchema.parse(body);
  const existing = await prisma.feature.findUnique({
    where: { id: context.params.id },
    include: { layer: { include: { project: true } } }
  });
  if (!existing || existing.layer.project.orgId !== user.orgId) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const feature = await prisma.feature.update({
    where: { id: context.params.id },
    data: {
      ...data,
      updatedAt: new Date(),
      version: { increment: 1 }
    }
  });
  return NextResponse.json(feature);
}
