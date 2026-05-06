import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";

let redisConnection: IORedis | undefined;
let emailQueue: Queue | undefined;

export function getRedisConnection() {
  redisConnection ??= new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null
  });

  return redisConnection;
}

export function getEmailQueue() {
  emailQueue ??= new Queue("email", {
    connection: getRedisConnection()
  });

  return emailQueue;
}
