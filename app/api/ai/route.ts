import { NextResponse } from "next/server";
import { z } from "zod";
import { aiQueue } from "@/lib/jobs/queues";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrgFlags } from "@/lib/flags/server";
import { randomUUID } from "crypto";

const schema = z.object({
  projectId: z.string(),
  task: z.enum(["text2map", "ocr2vector", "styleFromPrompt"]),
  prompt: z.string()
});

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schema.parse(await request.json());
  const flags = await getOrgFlags(user.orgId);
  if (flags.planTier === "BASIC" || flags.planTier === "STANDARD") {
    return new NextResponse("Upgrade required", { status: 402 });
  }
  const jobId = randomUUID();
  await aiQueue.add(
    body.task,
    {
      ...body,
      orgId: user.orgId,
      userId: user.id
    },
    { jobId }
  );
  return NextResponse.json({ jobId });
}
