import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrgFlags } from "@/lib/flags/server";
import { exportQueue } from "@/lib/jobs/queues";
import { randomUUID } from "crypto";

const schema = z.object({
  projectId: z.string(),
  format: z.string(),
  dpi: z.number().min(72).max(600)
});

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schema.parse(await request.json());
  const flags = await getOrgFlags(user.orgId);
  const premiumFormats = ["svg", "pdf", "geotiff", "shp"];
  if (premiumFormats.includes(body.format) && flags.planTier === "BASIC") {
    return new NextResponse("Upgrade required", { status: 402 });
  }
  const jobId = randomUUID();
  await exportQueue.add(
    "export",
    {
      ...body,
      orgId: user.orgId,
      userId: user.id
    },
    { jobId }
  );
  return NextResponse.json({ jobId });
}
