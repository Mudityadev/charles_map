import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/client";

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projection: z.string().default("EPSG:3857")
});

export async function GET() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { orgId: user.orgId },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const data = projectSchema.parse(body);
  const project = await prisma.project.create({
    data: {
      ...data,
      orgId: user.orgId,
      createdBy: user.id,
      updatedAt: new Date()
    }
  });
  return NextResponse.json(project, { status: 201 });
}
