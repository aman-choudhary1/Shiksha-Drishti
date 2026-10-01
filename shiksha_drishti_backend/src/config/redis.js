/**
 * Redis client with in-memory fallback for development.
 * If Redis is not available, sessions are stored in a Node.js Map.
 * In production, ensure Redis is running for proper session management.
 */
const Redis = require('ioredis');

const prefix = process.env.REDIS_KEY_PREFIX || 'sd:';

// In-memory fallback store
const memStore = new Map();

let redisAvailable = false;
let redis;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    keyPrefix: prefix,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    enableOfflineQueue: false,
  });

  redis.on('ready', () => { redisAvailable = true; console.log('[SD-Redis] Connected'); });
  redis.on('error', () => { redisAvailable = false; });
  redis.on('close', () => { redisAvailable = false; });
} catch {
  redisAvailable = false;
}

// Unified interface — same API regardless of Redis availability
const store = {
  async get(key) {
    if (redisAvailable) {
      try { return await redis.get(key); } catch { /* fallthrough */ }
    }
    const entry = memStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
    return entry.value;
  },
  async set(key, value, ...args) {
    // args may be: 'EX', ttlSeconds
    if (redisAvailable) {
      try { return await redis.set(key, value, ...args); } catch { /* fallthrough */ }
    }
    let ttl = null;
    const exIdx = args.indexOf('EX');
    if (exIdx !== -1 && args[exIdx + 1]) ttl = Number(args[exIdx + 1]) * 1000;
    memStore.set(key, { value, expiresAt: ttl ? Date.now() + ttl : null });
    return 'OK';
  },
  async del(key) {
    if (redisAvailable) {
      try { return await redis.del(key); } catch { /* fallthrough */ }
    }
    memStore.delete(key);
    return 1;
  },
};

module.exports = store;

