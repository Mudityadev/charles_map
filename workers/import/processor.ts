import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

export const importWorker = new Worker(
  "IMPORT_QUEUE",
  async (job) => {
    console.log("Processing import", job.data);
    return { status: "completed" };
  },
  { connection }
);
