import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, inject, ViewChild } from '@angular/core';
import Hls from 'hls.js';
import { SubscriptionService } from '../../main-pages/subscriptions/subscription.service';
import { WeeklyVideos } from '../../../../interfaces/subscriptions_interface';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';
import { ChartList } from '../../chartList/chartlist';



// interface WeeklyVideo {
//   id: number;
//   title: string;
//   thumbnail: string;
//    videoUrl: string;
// }

@Component({
  selector: 'app-weekly-report',
  imports: [CommonModule,ChartList],
  templateUrl: './weekly-report.html',
  styleUrl: './weekly-report.scss',
})
export class WeeklyReport {
protected subService = inject(SubscriptionState);
  protected weeks = this.subService.weekVideos;
  selectedVideoUrl: string | null = null;
  private videoElement!: HTMLVideoElement;
  private hls: Hls | null = null;
  constructor() {
  effect(() => {
  const url = this.subService.activeVideoUrls(); // ✅ correct

  if (url && this.videoElement) {
    this.initPlayer(url);
  }

  if (!url) {
    this.destroyPlayer();
  }
});
}

  // ✅ Get video element when modal opens
  @ViewChild('videoPlayer') set videoSetter(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el) {
      this.videoElement = el.nativeElement;

      // if (this.selectedVideoUrl) {
      //   this.initPlayer(this.selectedVideoUrl);
      // }
     const url = this.subService.activeVideoUrls(); // ✅ correct
if (url) {
  this.initPlayer(url);
}
    }
  }

  // ✅ Open modal
  openVideo(video: WeeklyVideos) {
    // this.selectedVideoUrl = video.path;

    this.subService.openWeeklyVideo(video.path)
  }

  // ✅ Close modal
  closeVideo() {
    this.destroyPlayer();
   this.subService.closeWeeklyVideo();
  }

  // ✅ Init player (same as DemoVideos)
  private initPlayer(url: string) {
    const video = this.videoElement;
    if (!video) return;

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(url);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());

      this.hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
        
          this.closeVideo();
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play();
    }
  }

  private destroyPlayer() {
    this.hls?.destroy();
    this.hls = null;

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
    }
  }

}
