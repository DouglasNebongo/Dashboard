
import { Redis } from '@upstash/redis';
let redis: Redis | undefined;;


import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | undefined;


if (process.env.SKIP_REDIS_CONNECTION !== 'true') {
  try {
    redisClient = createClient({ 
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));

    (async () => {
      await redisClient.connect();
      console.log("Standard Redis client connected."); 
    })();

  } catch (error) {
     console.error("Failed to initialize standard Redis client at runtime:", error);
  
  }
} else {
  console.log("Skipping standard Redis client initialization during build.");
}


export default redisClient; 






if (process.env.SKIP_REDIS_CONNECTION !== 'true') {

  try {
    redis = new Redis({ 
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    console.log("Upstash Redis client initialized for queue operations.");
  } catch (error) {
    console.error("Failed to initialize Upstash Redis client for queue operations at runtime:", error);
  
  }
} else {
  console.log("Skipping Upstash Redis client initialization for queue operations during build.");
}


export async function addToQueue(email: string) {
  
  if (!redis) {
    console.error("Redis client not initialized. Cannot add email to queue:", email);
 
    return; 
  }

  try {
    await redis.lpush('email-queue', email);
    console.log(`Added ${email} to email-queue.`); 
  } catch (error) {
     console.error(`Failed to add ${email} to email-queue:`, error);
    
   }

}