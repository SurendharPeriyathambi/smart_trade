import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ImageCacheService {
  private platformId = inject(PLATFORM_ID);
  private cacheName = 'hero-images-v1';
  private memoryCache = new Map<string, string>(); // survives navigation within session

  async getImage(url: string): Promise<string> {
    // SSR — return original URL, no browser APIs
    if (!isPlatformBrowser(this.platformId)) return url;

    // 1. Memory cache — instant, same session navigation
    if (this.memoryCache.has(url)) {
      
      return this.memoryCache.get(url)!;
    }

    // 2. Cache API — survives page refresh
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const cached = await cache.match(url);

        if (cached) {
         
          const blob = await cached.blob();
          const blobUrl = URL.createObjectURL(blob);
          this.memoryCache.set(url, blobUrl); // promote to memory
          return blobUrl;
        }

        // Not cached — fetch, store, return
      
        await cache.add(url);
        const fresh = await cache.match(url);
        const blob = await fresh!.blob();
        const blobUrl = URL.createObjectURL(blob);
        this.memoryCache.set(url, blobUrl);
        return blobUrl;

      } catch (e) {
        console.warn('[ImageCache] Cache API failed, using original URL', e);
        return url;
      }
    }

    return url;
  }

  // Call this if image URL changes (e.g. new banner uploaded)
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    if ('caches' in window) {
      await caches.delete(this.cacheName);
    }
  }
}