import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { DemoVideos as DemoVideo } from '../../../../interfaces/banner_interface';

import Hls from 'hls.js';

import { HomeService } from '../../main-pages/home/home_service';


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
      console.log('video Element Ready');

      const url = this.homeService.activeVideoUrls();
      if (url) this.initPlayer(url);
    }

  }

  constructor() {
    effect(() => {
      const url = this.homeService.activeVideoUrls();
      if (!url) this.destroyPlayer();
    })
  }

  openVideo(video: DemoVideo) {
    this.homeService.openVideo(video.video_id);
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
      console.error('Video element not found');
      return;
    }

    // ✅ Destroy previous HLS instance before creating new one
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(url);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());

      // ✅ Handle HLS errors
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {

          console.error('Fatal HLS error:', data);
          this.closeVideo();
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url;
      video.play();
    } else {
      console.error('HLS not supported in this browser');
    }
  }

}
