import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import Hls from 'hls.js';

interface WeeklyVideo {
  id: number;
  title: string;
  thumbnail: string;
   videoUrl: string;
}

@Component({
  selector: 'app-weekly-report',
  imports: [CommonModule],
  templateUrl: './weekly-report.html',
  styleUrl: './weekly-report.scss',
})
export class WeeklyReport {
  videos: WeeklyVideo[] = [
    {
      id: 1,
      title: 'Week 1 - Intro',
      thumbnail: 'assets/images/demo1.png',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    },
    {
      id: 2,
      title: 'Week 1 - Basics',
      thumbnail: 'assets/images/demo2.png',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    },
    {
      id: 3,
      title: 'Week 2 - Advanced',
      thumbnail: 'assets/images/demo3.png',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    },
    {
      id: 4,
      title: 'Week 2 - Practice',
      thumbnail: 'assets/images/demo4.png',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    }
  ];

  selectedVideoUrl: string | null = null;
  private videoElement!: HTMLVideoElement;
  private hls: Hls | null = null;

  // ✅ Get video element when modal opens
  @ViewChild('videoPlayer') set videoSetter(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el) {
      this.videoElement = el.nativeElement;

      if (this.selectedVideoUrl) {
        this.initPlayer(this.selectedVideoUrl);
      }
    }
  }

  // ✅ Open modal
  openVideo(video: WeeklyVideo) {
    this.selectedVideoUrl = video.videoUrl;
  }

  // ✅ Close modal
  closeVideo() {
    this.destroyPlayer();
    this.selectedVideoUrl = null;
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
          console.error('HLS error', data);
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
