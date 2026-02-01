import NodeCache from 'node-cache';
import { CACHE_TTL } from '@/lib/config/constants';

/**
 * Singleton Cache Service using node-cache
 * Provides in-memory caching with TTL support
 */
class CacheService {
  private cache: NodeCache;
  private static instance: CacheService;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: CACHE_TTL, // Default TTL in seconds
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Better performance for large objects
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set value in cache with optional custom TTL
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete key from cache
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get TTL for a key in seconds
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Export class for testing
export { CacheService };
