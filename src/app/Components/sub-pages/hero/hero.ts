
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, inject, PLATFORM_ID, HostListener, makeStateKey, TransferState, signal, effect } from '@angular/core';
import { BannerService } from './banner.service';
import { Banner } from '../../../../interfaces/banner_interface';
import { HomeService } from '../../main-pages/home/home_service';
import { LoaderService } from '../../../../services/engine/loader.service';
const BANNER_KEY = makeStateKey<Banner[]>('banners');
@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero  {
  

 protected homeService = inject(HomeService);
 private loaderService = inject (LoaderService)
 protected imageReady = signal(false);      // only true when fully decoded
  protected imageSrc = signal<string | null>(null); // set only after decode

  constructor() {
    effect(() => {
      const path = this.homeService.banner()[0]?.path;
  console.log("Effect running");
      if (path && !this.imageReady()) {
        this.loaderService.show();
        this.preloadImage(path);
      }
    });
  }

  private preloadImage(url: string) {
    const img = new Image();        // off-screen Image object
    img.src = url;

    img.decode()                    // waits until FULLY decoded, ready to paint
      .then(() => {
        this.imageSrc.set(url);     // now safe to show
        this.imageReady.set(true);
        this.loaderService.hide();
      })
      .catch(() => {
        this.imageSrc.set(url);     // show anyway on error
        this.imageReady.set(true);
        this.loaderService.hide();
      });
  }

 



 
}