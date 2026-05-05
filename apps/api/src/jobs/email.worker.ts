import { Worker } from "bullmq";
import { redisConnection } from "./queues";

export interface EmailJobData {
  to: string;
  templateCode: string;
  payload: Record<string, unknown>;
}

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    console.log("Email job placeholder", job.id, job.data.templateCode);
  },
  { connection: redisConnection }
);
