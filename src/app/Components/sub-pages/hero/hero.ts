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

  // Background banner state
  protected bgReady = signal(false);
  protected bgBannerSrc = signal<string | null>(null);
  protected bgAspectRatio = signal<string>('10 / 6');
  protected isMobile = signal(false);

  private lastBgPath = '';
  private resizeTimer: any;
  private currentBgImg: HTMLImageElement | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 768);
    }

    effect(() => {
      const banners = this.homeService.banner();
      if (!banners?.length) return;

      const selected = this.isMobile() ? (banners[1] ?? banners[0]) : banners[0];
      const path = selected?.path;

      if (!path || path === this.lastBgPath) return;

      this.lastBgPath = path;
      this.bgReady.set(false);     
      this.bgBannerSrc.set(null);  
      if (isPlatformBrowser(this.platformId)) {
        this.preloadBgImage(path);
      }
    });
  }

  private async preloadBgImage(url: string): Promise<void> {
    const src = await this.imageCacheService.getImage(url);

    if (this.currentBgImg) {
      this.currentBgImg.onload = null;
      this.currentBgImg.onerror = null;
      this.currentBgImg.src = '';
      this.currentBgImg = null;
    }

    const img = new Image();
    this.currentBgImg = img;

    img.onload = () => {
      if (this.currentBgImg !== img) return; // cancelled / replaced

       if (img.naturalWidth && img.naturalHeight) {
      this.bgAspectRatio.set(`${img.naturalWidth} / ${img.naturalHeight}`);
    }
      this.bgBannerSrc.set(src);   
      this.bgReady.set(true);      // fade-in trigger
      this.loaderService.hide();
    };

    img.onerror = () => {
      if (this.currentBgImg !== img) return;
      this.bgBannerSrc.set(src);
      this.bgReady.set(true);
      this.loaderService.hide();
    };

    img.src = src;
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
    if (this.currentBgImg) {
      this.currentBgImg.onload = null;
      this.currentBgImg.onerror = null;
      this.currentBgImg.src = '';
      this.currentBgImg = null;
    }
  }
}