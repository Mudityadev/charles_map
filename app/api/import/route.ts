import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { importQueue } from "@/lib/jobs/queues";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const sourceType = String(formData.get("sourceType") ?? "geojson");
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return new NextResponse("Missing file", { status: 400 });
  }
  const jobId = randomUUID();
  await importQueue.add(
    "import",
    {
      sourceType,
      fileName: file.name,
      orgId: user.orgId,
      userId: user.id
    },
    { jobId }
  );
  return NextResponse.json({ jobId });
}
