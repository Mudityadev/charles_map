import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

export const aiWorker = new Worker(
  "AI_QUEUE",
  async (job) => {
    console.log("Running AI task", job.data);
    return { status: "generated", assetRef: `s3://ai/${job.id}.json` };
  },
  { connection }
);
