import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  visibility: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
  sortOrder: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const user = await requireUser();
  const data = updateSchema.parse(await request.json());
  const existing = await prisma.layer.findUnique({ where: { id: context.params.id } });
  if (!existing || existing.orgId !== user.orgId) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const layer = await prisma.layer.update({
    where: { id: context.params.id },
    data
  });
  return NextResponse.json(layer);
}
