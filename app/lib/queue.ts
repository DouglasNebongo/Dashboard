


import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// add a job to the queue
export async function addToQueue(email: string) {
  await redis.lpush('email-queue', email);
}
