import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrgFlags } from "@/lib/flags/server";

const schema = z.object({
  projectId: z.string(),
  profile: z.enum(["driving", "walking", "cycling"]),
  origin: z.tuple([z.number(), z.number()]),
  destination: z.tuple([z.number(), z.number()])
});

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schema.parse(await request.json());
  const flags = await getOrgFlags(user.orgId);
  if (!flags.features.includes("analytics")) {
    return new NextResponse("Upgrade required", { status: 402 });
  }
  return NextResponse.json({
    geometry: {
      type: "LineString",
      coordinates: [body.origin, body.destination]
    },
    profile: body.profile,
    etaMinutes: 12
  });
}
