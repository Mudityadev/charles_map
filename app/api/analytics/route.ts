import { NextResponse } from "next/server";
import { z } from "zod";
import { runSpatialAnalysis } from "@/lib/geo/analytics";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrgFlags } from "@/lib/flags/server";

const schema = z.object({
  projectId: z.string(),
  operation: z.enum(["buffer", "union", "intersect", "isochrone"])
});

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schema.parse(await request.json());
  const flags = await getOrgFlags(user.orgId);
  if (!flags.features.includes("analytics")) {
    return new NextResponse("Upgrade required", { status: 402 });
  }
  const result = await runSpatialAnalysis(body);
  return NextResponse.json(result);
}
