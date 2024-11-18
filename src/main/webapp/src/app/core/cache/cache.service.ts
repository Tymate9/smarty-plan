import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  readonly cache = new Map<string, any>();
  private readonly maxCacheSize = 50 * 1024 * 1024; // Limite de cache de 50 Mo en octets

  setCache(key: string, data: any, maxAge: number = 90000) {
    const size = this.getObjectSize(data);
    this.manageCacheSize(size);
    this.cache.set(key, { data, size, timestamp: Date.now(), maxAge });
  }

  getCache(key: string): any {
    const cacheEntry = this.cache.get(key);
    if (cacheEntry) {
      const { data, timestamp, maxAge } = cacheEntry;
      if (Date.now() - timestamp < maxAge) {
        return data;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  deleteCache(key: string) {
    this.cache.delete(key);
  }

  private manageCacheSize(newEntrySize: number) {
    let currentSize = this.getCacheSize();
    while (currentSize + newEntrySize > this.maxCacheSize && this.cache.size > 0) {
      const oldestKey = this.getOldestCacheKey();
      if (oldestKey) {
        const entrySize = this.cache.get(oldestKey)?.size || 0;
        this.cache.delete(oldestKey);
        currentSize -= entrySize;
      }
    }
  }

  private getCacheSize(): number {
    return Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
  }

  private getOldestCacheKey(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });
    return oldestKey;
  }

  private getObjectSize(obj: any): number {
    return new Blob([JSON.stringify(obj)]).size;
  }

  cacheBust(basePath: string) {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.startsWith(basePath)) {
        this.deleteCache(key);
      }
    });
  }
}
