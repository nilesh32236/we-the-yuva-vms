import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

// Upstash (and other managed Redis) uses rediss:// for TLS.
// ioredis needs tls options when the scheme is rediss://.
const isTLS = env.REDIS_URL.startsWith('rediss://');

let redis: Redis | null = null;

// Defer Redis connection to avoid blocking startup
const connect = () => {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      ...(isTLS && {
        tls: {
          rejectUnauthorized: false, // Upstash uses a self-signed cert on some regions
        },
      }),
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('ready', () => logger.info('Redis ready'));
    redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redis.on('close', () => logger.warn('Redis connection closed — will retry'));
    redis.on('reconnecting', (delay: number) => logger.info(`Redis reconnecting in ${delay}ms`));
  } catch (err) {
    logger.warn('Redis unavailable — running without cache/queue', { error: (err as Error).message });
  }
};

setTimeout(connect, 0);

export { redis };
