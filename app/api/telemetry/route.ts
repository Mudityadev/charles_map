import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/requireUser";

const schema = z.object({
  deviceId: z.string(),
  coordinates: z.array(z.number()).length(2),
  speed: z.number().optional()
});

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schema.parse(await request.json());
  await prisma.auditLog.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      action: "TELEMETRY_INGEST",
      entityType: "device",
      entityId: body.deviceId,
      diff: body,
      ts: new Date()
    }
  });
  return NextResponse.json({ ok: true });
}
