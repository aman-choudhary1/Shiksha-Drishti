/**
 * cache.js
 * High-performance in-memory TTL cache with auto-expiry.
 * Prevents redundant heavy analytical queries across millions of records.
 */

const store = new Map();

// Periodic cleanup of expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of store.entries()) {
    if (item.expiresAt && now > item.expiresAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

const get = (key) => {
  const item = store.get(key);
  if (!item) return null;
  if (item.expiresAt && Date.now() > item.expiresAt) {
    store.delete(key);
    return null;
  }
  return item.value;
};

const set = (key, value, ttlSeconds = 600) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

const del = (key) => {
  store.delete(key);
};

const clear = () => {
  store.clear();
};

module.exports = { get, set, del, clear };
