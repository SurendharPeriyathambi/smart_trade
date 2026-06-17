import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { DemoVideos as DemoVideo } from '../../../../interfaces/banner_interface';
import Hls from 'hls.js';
import { HomeService } from '../../main-pages/home/home_service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { Router } from '@angular/router';



@Component({
  selector: 'app-demo-videos',
  imports: [CommonModule],
  templateUrl: './demo-videos.html',
  styleUrl: './demo-videos.scss',
})
export class DemoVideos {

 
  protected homeService = inject(HomeService);
  private pendingUrl: string | null = null;
  private videoElement!: HTMLVideoElement;


  videos: DemoVideo[] = [];
  activeVideoUrl: string | null = null;

  isloading = false;
  private hls: Hls | null = null;

  @ViewChild('videoPlayer') set VideoSetter(element: ElementRef<HTMLVideoElement> | undefined) {
    if (element) {
      this.videoElement = element.nativeElement;
     

      const url = this.homeService.activeVideoUrls();
      if (url) this.initPlayer(url);
    }

  }

  constructor(
    private router: Router,
  private storage: StorageEngine
  ) {
    effect(() => {
      const url = this.homeService.activeVideoUrls();
      if (!url) this.destroyPlayer();
    })
  }

  openVideo(video: DemoVideo, index: number) {
  if (index < 3) {
    this.homeService.openVideo(video.video_id);
    return;
  }
  const isLoggedIn = !!this.storage.getAccessToken();

  if (isLoggedIn) {
    this.homeService.openVideo(video.video_id);
  } else {
    this.router.navigate(['/login']);
  }
}

  closeVideo() {
    this.destroyPlayer();
    this.homeService.closeVideo();
  }



  private destroyPlayer() {
    this.hls?.destroy();
    this.hls = null;
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
    }
  }


  initPlayer(url: string) {
    const video = this.videoElement;
    if (!video) {
     
      return;
    }

    //    Destroy previous HLS instance before creating new one
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(url);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());

      //    Handle HLS errors
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {

        
          this.closeVideo();
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url;
      video.play();
    } else {
      
    }
  }

}
