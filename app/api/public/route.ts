import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const schema = z.object({
  apiKey: z.string(),
  projectId: z.string()
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const apiKey = await prisma.apiKey.findFirst({ where: { hash: body.apiKey } });
  if (!apiKey) {
    return new NextResponse("Invalid key", { status: 401 });
  }
  const project = await prisma.project.findFirst({ where: { id: body.projectId, orgId: apiKey.orgId } });
  if (!project) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      mapStyleJson: project.mapStyleJson
    }
  });
}
