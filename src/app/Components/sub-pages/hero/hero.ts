import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal, effect, HostListener, OnDestroy } from '@angular/core';
import { HomeService } from '../../main-pages/home/home_service';
import { LoaderService } from '../../../../services/engine/loader.service';
import { ImageCacheService } from '../../../../services/engine/image_cache.service';

@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnDestroy {
  protected homeService = inject(HomeService);
  private loaderService = inject(LoaderService);
  private platformId = inject(PLATFORM_ID);
  private imageCacheService = inject(ImageCacheService);

  protected imageReady = signal(false);
  protected imageSrc = signal<string | null>(null);
  protected isMobile = signal(false);

  private lastLoadedPath = '';
  private resizeTimer: any;
  private currentImg: HTMLImageElement | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 768);
    }

    effect(() => {
      const banners = this.homeService.banner();
      if (!banners?.length) return;

      const selected = this.isMobile() ? (banners[1] ?? banners[0]) : banners[0];
      const path = selected?.path;

      if (!path || path === this.lastLoadedPath) return;

      this.lastLoadedPath = path;
      this.imageReady.set(false);   // show skeleton
      this.imageSrc.set(null);      // clear old image

      if (isPlatformBrowser(this.platformId)) {
        this.loadImage(path);
      }
    });
  }

  private async loadImage(url: string): Promise<void> {
    // ✅ Gets from memory or Cache API if visited before — instant
    const src = await this.imageCacheService.getImage(url);

    // Cancel any previous in-flight decode
    if (this.currentImg) {
      this.currentImg.src = '';
      this.currentImg = null;
    }

    const img = new Image();
    this.currentImg = img;
    img.src = src;

    // If already cached, decode() resolves almost instantly
    img.decode()
      .then(() => {
        if (!img.src) return; // was cancelled
        this.imageSrc.set(src);       // ✅ set src only after decode ready
        this.imageReady.set(true);    // fade in
        this.loaderService.hide();
      })
      .catch(() => {
        this.imageSrc.set(src);
        this.imageReady.set(true);
        this.loaderService.hide();
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.isMobile.set(window.innerWidth < 768);
      }
    }, 150);
  }

  ngOnDestroy(): void {
    clearTimeout(this.resizeTimer);
    if (this.currentImg) {
      this.currentImg.src = '';
      this.currentImg = null;
    }
  }
}