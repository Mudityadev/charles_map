import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");

export const importQueue = new Queue("IMPORT_QUEUE", { connection });
export const exportQueue = new Queue("EXPORT_QUEUE", { connection });
export const aiQueue = new Queue("AI_QUEUE", { connection });
