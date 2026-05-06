import { Worker } from "bullmq";
import { processEmailJob, type EmailJobData } from "../modules/email/email.service";
import { getRedisConnection } from "./queues";

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    await processEmailJob(job.data);
  },
  { connection: getRedisConnection() }
);
