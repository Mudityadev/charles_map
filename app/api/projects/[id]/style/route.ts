import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/requireUser";
import { z } from "zod";

const schema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  opacity: z.number().optional(),
  ruleProperty: z.string().optional(),
  ruleValue: z.string().optional()
});

export async function POST(request: Request, context: { params: { id: string } }) {
  const user = await requireUser();
  const body = schema.parse(await request.json());
  const project = await prisma.project.findFirst({ where: { id: context.params.id, orgId: user.orgId } });
  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }
  await prisma.auditLog.create({
    data: {
      orgId: project.orgId,
      userId: user.id,
      action: "STYLE_UPDATE",
      entityType: "project",
      entityId: project.id,
      diff: body
    }
  });
  return NextResponse.json({ ok: true });
}
