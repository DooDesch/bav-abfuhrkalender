import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cacheService } from './cache.service';

const TEST_KEY = 'test-cache-key';

describe('CacheService', () => {
  beforeEach(() => {
    cacheService.delete(TEST_KEY);
  });

  afterEach(() => {
    cacheService.delete(TEST_KEY);
  });

  it('get returns undefined for missing key', () => {
    expect(cacheService.get(TEST_KEY)).toBeUndefined();
  });

  it('set and get store and retrieve value', () => {
    const value = { foo: 'bar' };
    cacheService.set(TEST_KEY, value);
    expect(cacheService.get(TEST_KEY)).toEqual(value);
  });

  it('getTtl returns absolute expiry timestamp in ms after set with TTL', () => {
    const ttlSeconds = 60;
    const beforeSet = Date.now();
    cacheService.set(TEST_KEY, { data: 1 }, ttlSeconds);
    const expiryTimestamp = cacheService.getTtl(TEST_KEY);
    const afterSet = Date.now();

    expect(expiryTimestamp).toBeDefined();
    expect(expiryTimestamp).toBeGreaterThan(0);
    // getTtl returns absolute timestamp: approximately now + ttl*1000
    const expectedMin = beforeSet + ttlSeconds * 1000 - 100;
    const expectedMax = afterSet + ttlSeconds * 1000 + 100;
    expect(expiryTimestamp).toBeGreaterThanOrEqual(expectedMin);
    expect(expiryTimestamp).toBeLessThanOrEqual(expectedMax);
  });

  it('delete removes key', () => {
    cacheService.set(TEST_KEY, { x: 1 });
    expect(cacheService.get(TEST_KEY)).toBeDefined();
    cacheService.delete(TEST_KEY);
    expect(cacheService.get(TEST_KEY)).toBeUndefined();
    expect(cacheService.getTtl(TEST_KEY)).toBeUndefined();
  });

  it('has returns true when key exists, false otherwise', () => {
    expect(cacheService.has(TEST_KEY)).toBe(false);
    cacheService.set(TEST_KEY, 1);
    expect(cacheService.has(TEST_KEY)).toBe(true);
    cacheService.delete(TEST_KEY);
    expect(cacheService.has(TEST_KEY)).toBe(false);
  });
});
