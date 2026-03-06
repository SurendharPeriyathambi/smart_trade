// import { CommonModule } from '@angular/common';
// import { Component, OnInit } from '@angular/core';
// import { BannerService } from './banner.service';
// import { Banner, HomeData } from '../../../../interfaces/banner_interface';

// @Component({
//   selector: 'app-hero',
//   imports: [CommonModule],
//   templateUrl: './hero.html',
//   styleUrl: './hero.scss',
// })
// export class Hero implements OnInit{
// homeData! : Banner ;
//   constructor(private bannerService:BannerService){

//   }

  
//   ngOnInit(): void {
//   this.getBanners();
//   }

//   getBanners(){

//     this.bannerService.getHomeData().subscribe({
//       next:(res) =>{
//         if (res.status) {
//           console.log('responce',res);
//           this.homeData = res.data.banner;
//         }
//       },
//        error: (err) => {
//       console.error(err);
//     }
//     })
//   }


// }
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

 

//   @HostListener('window:resize',)
//   onResize() {
// this.setActiveBanner();
//   }

//   setActiveBanner(){
//     const mobileWidth =window.innerWidth <= 768;
//     this.activeBanner = mobileWidth? this.homeData.find(b=>b.title === 'mobile') ??this.homeData[0] : this.homeData.find(b=>b.title === 'website') ?? this.homeData[0]; // Define your mobile width threshold
//   }

 
}