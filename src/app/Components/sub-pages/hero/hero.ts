import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  effect,
  HostListener,
  inject,
  PLATFORM_ID,
  signal
} from '@angular/core';

import { HomeService } from '../../main-pages/home/home_service';
import { environment } from '../../../environment';

@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {

  protected homeService = inject(HomeService);
  private platformId = inject(PLATFORM_ID);

  protected bgReady = signal(false);
  protected bgBannerSrc = signal<string | null>(null);
  protected isMobile = signal(false);

  private resizeTimer: any;

 constructor() {
  if (isPlatformBrowser(this.platformId)) {
    this.isMobile.set(window.innerWidth < 768);
  }

  effect(() => {
    const banners = this.homeService.banner();
    if (!banners?.length) return;

    const selected = this.isMobile() ? (banners[1] ?? banners[0]) : banners[0];
    const path = selected?.path;
    if (!path) return;

    const fullUrl = this.getFullImageUrl(path);

    // ✅ Only reset the loading state if the image actually changed
    if (fullUrl === this.bgBannerSrc()) {
      return;
    }

    this.bgReady.set(false);
    this.bgBannerSrc.set(fullUrl);
  });
}

  private getFullImageUrl(path: string): string {
    return `${environment.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
  protected onHeroImageLoad(): void {
  this.bgReady.set(true);
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
}