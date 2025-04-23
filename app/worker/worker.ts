import { generateVerificationCode } from '../lib/auth';
import { sendVerificationEmail } from '../lib/email';
import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('Missing required environment variables for Upstash Redis.');
  process.exit(1);
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Configuration
const CONFIG = {
  MAX_RPS: 10,
  BATCH_SIZE: 5,
  RETRY_LIMIT: 3,
  EMPTY_QUEUE_DELAY: 5000,
  ERROR_DELAY: 1000,
  CONCURRENCY: 2,
};

class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async waitForToken(): Promise<void> {
    while (true) {
      const now = Date.now();
      const elapsed = now - this.lastRefill;
      const refillAmount = Math.floor(elapsed * (this.refillRate / 1000));
      
      if (refillAmount > 0) {
        this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
        this.lastRefill = now;
      }
      
      if (this.tokens > 0) {
        this.tokens--;
        break;
      } else {
        const waitTime = Math.ceil((1 - this.tokens) * (1000 / this.refillRate));
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}

const limiter = new RateLimiter(CONFIG.MAX_RPS, CONFIG.MAX_RPS);

async function processEmail(email: string): Promise<void> {
  for (let attempt = 1; attempt <= CONFIG.RETRY_LIMIT; attempt++) {
    try {
      await limiter.waitForToken();
      console.log(`Processing ${email} (attempt ${attempt})`);
      
      const { code } = await generateVerificationCode(email);
      await sendVerificationEmail(email, code);
      
      // Remove the email from the processing queue on success
      await redis.lrem('processing-queue', 1, email);
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${email}:`, error);
      
      if (attempt === CONFIG.RETRY_LIMIT) {
        await redis.lpush('dead-letter-queue', email);
        await redis.lrem('processing-queue', 1, email);
        console.error(`Permanent failure for ${email}`);
      } else {
        // Exponential backoff delay
        await new Promise(resolve =>
          setTimeout(resolve, CONFIG.ERROR_DELAY * (2 ** (attempt - 1)))
        );
      }
    }
  }
}

async function processBatch(): Promise<void> {
  const emails: string[] = [];

  // Atomically move up to BATCH_SIZE emails from email-queue to processing-queue.
  for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
    const email = await redis.lmove('email-queue', 'processing-queue', 'right', 'left');
    if (email) {
      emails.push(email);
    } else {
      break;
    }
  }

  if (emails.length === 0) return;

  // Process all emails concurrently with per-email retry logic.
  await Promise.allSettled(emails.map(email => processEmail(email)));
}

async function runWorker(signal: AbortSignal): Promise<void> {
  console.log('Worker started with PID:', process.pid);
  
  const processingLoop = async () => {
    while (!signal.aborted) {
      try {
        await processBatch();
        // If no email was processed, wait a bit before trying again.
        await new Promise(resolve => setTimeout(resolve, CONFIG.EMPTY_QUEUE_DELAY));
      } catch (error) {
        console.error('Worker processing error:', error);
        await new Promise(resolve => setTimeout(resolve, CONFIG.ERROR_DELAY));
      }
    }
  };

  // Start multiple concurrent processing loops.
  const workers = Array.from({ length: CONFIG.CONCURRENCY }, () => processingLoop());
  await Promise.all(workers);
  console.log('Worker shutdown complete');
}

// Shutdown handling
const abortController = new AbortController();
['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, async () => {
    console.log(`Received ${sig}, shutting down...`);
    abortController.abort();
    await new Promise(resolve => setTimeout(resolve, CONFIG.ERROR_DELAY * CONFIG.RETRY_LIMIT));
    process.exit(0);
  });
});

// Start the worker
runWorker(abortController.signal).catch(error => {
  console.error('Worker fatal error:', error);
  process.exit(1);
});
