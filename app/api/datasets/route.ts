import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/requireUser";

const datasetSchema = z.object({
  name: z.string(),
  sourceType: z.string(),
  sourceRef: z.string(),
  schema: z.record(z.any()).default({}),
  refreshPolicy: z.string().optional()
});

export async function GET() {
  const user = await requireUser();
  const datasets = await prisma.dataset.findMany({ where: { orgId: user.orgId } });
  return NextResponse.json(datasets);
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const data = datasetSchema.parse(body);
  const dataset = await prisma.dataset.create({
    data: {
      ...data,
      orgId: user.orgId
    }
  });
  return NextResponse.json(dataset, { status: 201 });
}
