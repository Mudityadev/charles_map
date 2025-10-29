import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/requireUser";

const featureSchema = z.object({
  layerId: z.string(),
  geometry: z.any(),
  properties: z.record(z.any()).default({}),
  version: z.number().default(1)
});

export async function POST(request: Request) {
  const user = await requireUser();
  const payload = featureSchema.parse(await request.json());
  const layer = await prisma.layer.findFirst({ where: { id: payload.layerId }, include: { project: true } });
  if (!layer || layer.project.orgId !== user.orgId) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const feature = await prisma.feature.create({
    data: {
      ...payload,
      createdBy: user.id,
      updatedAt: new Date()
    }
  });
  return NextResponse.json(feature, { status: 201 });
}
