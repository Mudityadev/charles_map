import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

export const exportWorker = new Worker(
  "EXPORT_QUEUE",
  async (job) => {
    console.log("Rendering export", job.data);
    return { downloadUrl: `s3://exports/${job.id}.zip` };
  },
  { connection }
);
