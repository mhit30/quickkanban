import Redis from "ioredis";

// default connect is localhost 6379
let redis;
function initRedis() {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASS || undefined,
    });
  } catch (err) {
    console.log(err);
  }
}

function getRedis() {
  if (!redis) {
    throw new Error("Redis not initialized.");
  }
  return redis;
}

const redis_client = { getRedis, initRedis };

export default redis_client;
