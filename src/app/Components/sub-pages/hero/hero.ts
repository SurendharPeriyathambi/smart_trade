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
import { Component, OnInit, inject, PLATFORM_ID, HostListener, makeStateKey, TransferState } from '@angular/core';
import { BannerService } from './banner.service';
import { Banner } from '../../../../interfaces/banner_interface';
const BANNER_KEY = makeStateKey<Banner[]>('banners');
@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit {
  homeData: Banner[]=[];
activeBanner : Banner | null = null;
  private bannerService = inject(BannerService);
   private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
   
      this.getBanners();
    
    //  if (this.transferState.hasKey(BANNER_KEY)) {
    //   this.homeData = this.transferState.get(BANNER_KEY, []);
    //   this.transferState.remove(BANNER_KEY);
    // } else {
    //   this.getBanners();
    // }
  }

  getBanners() {
    this.bannerService.getHomeData().subscribe({
      next: (res) => {
        if (res.status) {
          this.homeData = res.data?.banner ;
          // this.setActiveBanner();
          //  if (!isPlatformBrowser(this.platformId)) {
          //   this.transferState.set(BANNER_KEY, this.homeData);
          // }
        
        }
      },
      error: (err) => {
        console.error(err);
      }
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