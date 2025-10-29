import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const user = await requireUser();
  if (user.role !== "owner") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const auditLogs = await prisma.auditLog.findMany({
    where: { orgId: user.orgId },
    orderBy: { ts: "desc" },
    take: 50
  });
  return NextResponse.json({ auditLogs });
}
