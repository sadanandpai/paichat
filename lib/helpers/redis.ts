import { Redis } from "@upstash/redis";

let redis: Redis | undefined;

/** Shared Upstash REST client. Uses UPSTASH_REDIS_REST_URL + TOKEN. */
export function getRedis(): Redis {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Missing env: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
  }

  redis = new Redis({ url, token });
  return redis;
}
