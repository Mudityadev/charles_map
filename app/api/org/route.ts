import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrgFlags } from "@/lib/flags/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const user = await requireUser();
  const org = await prisma.org.findFirst({ where: { id: user.orgId } });
  const flags = await getOrgFlags(user.orgId);
  return NextResponse.json({ org, flags });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (user.role !== "owner" && user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payload = await request.json();
  const updated = await prisma.org.update({ where: { id: user.orgId }, data: payload });
  return NextResponse.json(updated);
}
