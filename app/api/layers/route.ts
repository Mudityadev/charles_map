import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/client";

const createSchema = z.object({
  projectId: z.string(),
  name: z.string().optional(),
  type: z.enum(["vector", "raster", "tile", "wms", "threeD"]),
  sourceRef: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export async function POST(request: Request) {
  const user = await requireUser();
  const payload = createSchema.parse(await request.json());
  const project = await prisma.project.findFirst({ where: { id: payload.projectId, orgId: user.orgId } });
  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }
  const layer = await prisma.layer.create({
    data: {
      ...payload,
      orgId: project.orgId,
      visibility: true,
      opacity: 1,
      sortOrder: 0
    }
  });
  return NextResponse.json(layer, { status: 201 });
}
