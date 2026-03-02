import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { DemoVideos as DemoVideo } from '../../../../interfaces/banner_interface';
import { BannerService } from '../hero/banner.service';
import { error } from 'console';
import Hls from 'hls.js';
import { ToastService } from '../../../../services/engine/toast.service';


@Component({
  selector: 'app-demo-videos',
  imports: [CommonModule],
  templateUrl: './demo-videos.html',
  styleUrl: './demo-videos.scss',
})
export class DemoVideos implements OnInit {
  private pendingUrl: string | null = null;
  private videoElement!: HTMLVideoElement;


  videos: DemoVideo[] = [];
  activeVideoUrl: string | null = null;
  // activeVideo: any = null;
  isloading = false;
  private hls: Hls | null = null;
  private bannerService = inject(BannerService);

  private cdr = inject(ChangeDetectorRef);
private toast =inject(ToastService);
  ngOnInit(): void {
    this.getVideos();
  }
  getVideos() {

    this.bannerService.getHomeData().subscribe({
      next: (res) => {
        if (res.status) {
          this.videos = res.data.demo_videos ?? [];
          console.log('demo videos', this.videos);
        }

      },
      error: (err) => {
        console.error('Error fetching demo videos:', err);
      }
    })
  }



  isModalOpen = false;

  openVideo(video: DemoVideo) {
    if (this.isloading) return;
    this.isloading = true;
    this.bannerService.getVideoUrl(video.video_id).subscribe({
      next: (res) => {
        if (res.status) {
          const url = res.data.cdn_url;
          this.activeVideoUrl = url;

          console.log("Video URL:", this.activeVideoUrl);
          this.pendingUrl = url;
          this.isModalOpen = true;
          this.cdr.detectChanges();
        }
        this.isloading = false;
      },
      error: (err) => {
        console.error('Error fetching video URL:', err);
        this.isloading = false;
      }
    })
  }

  @ViewChild('videoPlayer') set VideoSetter(element: ElementRef<HTMLVideoElement> | undefined) {
    if (element) {
      this.videoElement = element.nativeElement;
      console.log('video Element Ready');
      if (this.pendingUrl) {
        this.initPlayer(this.pendingUrl);
        this.pendingUrl = null
      }
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
  closeVideo() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
    }
    this.activeVideoUrl = null;
    this.isModalOpen = false;  // hide modal
    this.pendingUrl = null;
  }
}
