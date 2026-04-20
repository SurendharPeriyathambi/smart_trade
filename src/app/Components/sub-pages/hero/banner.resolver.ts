import { inject, PLATFORM_ID } from '@angular/core';
import { ResolveFn, } from '@angular/router';
import { HomeService } from '../../main-pages/home/home_service';
import { BannerService } from '../../sub-pages/hero/banner.service';
import { map, of, tap } from 'rxjs';
import { Banner } from '../../../../interfaces/banner_interface';
import { isPlatformBrowser } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/core';

const BANNER_STATE_KEY = makeStateKey<Banner[]>('hero-banners');

export const bannerResolver: ResolveFn<Banner[]> = () => {
  const homeService = inject(HomeService);
  const bannerService = inject(BannerService);
  const platformId = inject(PLATFORM_ID);
  const transferState = inject(TransferState);




  // ✅ BROWSER — check TransferState first (data from SSR)
  if (isPlatformBrowser(platformId)) {
    const ssrData = transferState.get(BANNER_STATE_KEY, []);

    if (ssrData.length) {
    
      transferState.remove(BANNER_STATE_KEY); // clean up
      homeService['banners'].set(ssrData);
      injectPreloadLink(ssrData, platformId);
      return of(ssrData);                     // ✅ no API call on browser
    }

    // Already loaded from previous navigation
    if (homeService.banner().length) {
      injectPreloadLink(homeService.banner(), platformId);
      return of(homeService.banner());
    }
  }

  // ✅ SERVER or first browser load — fetch from API
  return bannerService.getHomeData().pipe(
    tap((res) => {
        
      if (res.status) {
        homeService['banners'].set(res.data.banner ?? []);
        homeService['demoVideos'].set(res.data.demo_videos ?? []);

        // ✅ SERVER — save data so browser doesn't re-fetch
        if (!isPlatformBrowser(platformId)) {
          transferState.set(BANNER_STATE_KEY, res.data.banner ?? []);
        } else {
          injectPreloadLink(res.data.banner ?? [], platformId);
        }
      }
    }),
    map((res) => res.data.banner ?? [])
  );
};

function injectPreloadLink(banners: Banner[], platformId: object) {
  if (!isPlatformBrowser(platformId) || !banners.length) return;

  const isMobile = window.innerWidth < 768;
  const selected = isMobile ? (banners[1] ?? banners[0]) : banners[0];
  const path = selected?.path;
  if (!path) return;

  const existing = document.querySelector('link[data-hero-preload]');
  if (existing) {
    (existing as HTMLLinkElement).href = path;
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = path;
  link.setAttribute('fetchpriority', 'high');
  link.setAttribute('data-hero-preload', 'true');
  document.head.appendChild(link);
}