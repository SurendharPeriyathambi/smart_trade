import { Observable } from "rxjs";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { inject, Injectable, signal } from "@angular/core";
import { BannerService } from "../../sub-pages/hero/banner.service";
import { Banner, DemoVideos } from "../../../../interfaces/banner_interface";

@Injectable({ providedIn: 'root' })
export class HomeService {
   
     private bannerService = inject (BannerService);

    //  Raw State Signals
    private banners = signal <Banner[]>([]);
    private demoVideos =signal <DemoVideos[]>([]);
    private loading = signal (false);
    private error = signal <string | null> (null);
    private activeVideoUrl = signal <string | null >(null);
    private _videoLoading = signal(false);
    private _isModalOpen  = signal (false);
    // public accesss for component
   readonly banner = this.banners.asReadonly();
  readonly demoVideo = this.demoVideos.asReadonly();
  readonly loadings = this.loading.asReadonly();
  readonly errors = this.error.asReadonly();
  readonly activeVideoUrls = this.activeVideoUrl.asReadonly();
  readonly videoLoading = this._videoLoading.asReadonly();
 readonly isModalOpen =  this._isModalOpen.asReadonly();

    // parent api calling..
    loadHomeData ():void{
        if (this.loading()) return;
        this.loading.set(true);
        this.error.set(null);


        this.bannerService.getHomeData().subscribe({
            next:(res)=>{
                if (res.status) {
                    this.banners.set(res.data.banner??[]);
                    this.demoVideos.set(res.data.demo_videos ?? []);
                }
                this.loading.set(false);
            },
            error:(err)=>{
                this.error.set(err.message ?? "failed to load Data");
                this.loading.set(false);
            }
        });

    }

    openVideo (videoId:string){
        if (this._videoLoading()) return;
        this._videoLoading.set(true);
        
        this.bannerService.getVideoUrl(videoId).subscribe({
            next:(res)=>{
                if (res.status) {
                    this.activeVideoUrl.set(res.data.cdn_url);
                    this._isModalOpen.set(true)
                }
                this._videoLoading.set(false);
            },
            error:()=> this._videoLoading.set(false)
        });
    }

     closeVideo(): void {
    this.activeVideoUrl.set(null);
    this._isModalOpen.set(false);
  }

}