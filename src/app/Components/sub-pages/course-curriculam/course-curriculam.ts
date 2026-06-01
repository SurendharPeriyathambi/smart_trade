import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, inject, effect, signal, ChangeDetectorRef } from '@angular/core';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';
import Hls from 'hls.js';
import { CourseLesson, CourseVideo } from '../../../../interfaces/subscriptions_interface';
import { WeeklyReport } from '../weekly-report/weekly-report';
import { AuthStateService } from '../../main-pages/login/auth-state.service';

@Component({
  selector: 'app-course-curriculam',
  imports: [CommonModule, WeeklyReport],
  templateUrl: './course-curriculam.html',
  styleUrl: './course-curriculam.scss',
})
export class CourseCurriculam {
isFullscreen = false;
  private subState = inject(SubscriptionState);
  private authState = inject(AuthStateService);
  private cdr = inject(ChangeDetectorRef); // ← ADD THIS
  @ViewChild('videoContainer')
videoContainer!: ElementRef<HTMLDivElement>;

watermarkVisible = true;

  course           = this.subState.course;
  courseLoading    = this.subState.courseLoading;
  activeVideoUrl   = this.subState.activeVideoUrl;
  videoLoading     = this.subState.videoLoading;
  selectedVideo    = this.subState.selectedVideo;
  subscription     = this.subState.subscription;
  loginIp          = this.authState.ip;
  unlockedVideoIds = this.subState.unlockedVideoIds;
  videoThumbnails  = this.subState.videoThumbnails;
  unlockLoading    = this.subState.unlockLoading;
  pendingOpenIds   = this.subState.pendingOpenIds;
  profile          = this.subState.profile;

  showSeekForward  = false;
  showSeekBackward = false;
  private lastTapTime = 0;
  private lastTapSide: 'left' | 'right' | null = null;
  private seekFeedbackTimer: any = null;

  expandedLessonId: number | null = null;
  previewVideo: CourseVideo | null = null;
  videoPlayerOpen = false;

  private hls: Hls | null = null;
  private videoElement!: HTMLVideoElement;
  private pendingUrl: string | null = null;

  // ─────────────────────────────────────────────────────────────────────────
  // ViewChild — fires AFTER *ngIf renders the element
  // ─────────────────────────────────────────────────────────────────────────
  @ViewChild('videoPlayer') set videoSetter(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el && el.nativeElement !== this.videoElement) {
      this.videoElement = el.nativeElement;
      this.videoElement.removeEventListener('ended', this.onVideoEndedBound);
      this.videoElement.addEventListener('ended', this.onVideoEndedBound);

      // ✅ pendingUrl is ready — DOM just appeared — play immediately
      if (this.pendingUrl) {
        const url = this.pendingUrl;
        this.pendingUrl = null;
        this.initPlayer(url);
      }
    }
  }

  private onVideoEndedBound = () => this.onVideoEnded();

  constructor() {
    effect(() => {
      const url = this.subState.activeVideoUrl();
      if (url) {
        this.previewVideo = null;
        this.pendingUrl = url;       // ← 1. store URL
        this.videoPlayerOpen = true; // ← 2. show modal

        // ✅ KEY FIX: force Angular to render *ngIf immediately
        // so @ViewChild setter fires RIGHT NOW in this cycle
        this.cdr.detectChanges();

        // ← 3. After detectChanges, videoElement NOW exists
        // If ViewChild setter already picked it up, pendingUrl is null
        // If not (edge case), try directly here as fallback
        if (this.pendingUrl && this.videoElement) {
          const u = this.pendingUrl;
          this.pendingUrl = null;
          this.initPlayer(u);
        }

      } else {
        this.pendingUrl = null;
        this.destroyPlayer();
        this.videoPlayerOpen = false;
        this.cdr.detectChanges(); // ← keep in sync on close too
      }
    });

    effect(() => {
      const course = this.subState.course();
      if (course?.lesson?.length && this.expandedLessonId === null) {
        this.expandedLessonId = course.lesson[0].id;
      }
    });
      // Listen for fullscreen change (e.g. user presses Escape)
  document.addEventListener('fullscreenchange', () => {
    this.isFullscreen = !!document.fullscreenElement;
    this.cdr.detectChanges();
  });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Play click
  // ─────────────────────────────────────────────────────────────────────────
  onPlayClick(video: CourseVideo) {
    if (this.unlockLoading() !== null) return;
    if (this.videoLoading()) return;

    const subscriptionId = this.subscription()?.id;
    if (!subscriptionId) return;

    this.subState.unlockAndOpenVideo(video, subscriptionId);
  }

  openPreview(video: CourseVideo) {
    this.previewVideo = video;
    this.subState.fetchThumbnailForPreview(video.id, video.image);
  }

  closePreview() { this.previewVideo = null; }

  getThumbnail(video: CourseVideo): string {
    return this.videoThumbnails()[video.id] || video.image;
  }

  playVideo(video: CourseVideo) {
    this.previewVideo = null;
    this.subState.openCourseVideo(video.video, video);
  }

  toggleLesson(id: number) {
    this.expandedLessonId = this.expandedLessonId === id ? null : id;
  }

  isUnlocked(videoId: number): boolean {
    if (this.pendingOpenIds().has(videoId)) return false;
    return this.unlockedVideoIds().has(videoId);
  }

  isUnlocking(videoId: number): boolean {
    return this.unlockLoading() === videoId || this.pendingOpenIds().has(videoId);
  }

  canUnlock(lesson: CourseLesson, videoIndex: number): boolean {
    return this.subState.canUnlockVideo(lesson.id, videoIndex);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Close video
  // ─────────────────────────────────────────────────────────────────────────
  closeVideo() {
    if (this.videoElement) {
      this.videoElement.pause();
      const stoppedAt      = Math.floor(this.videoElement.currentTime);
      const videoData      = this.selectedVideo();
      const subscriptionId = this.subscription()?.id;
      if (videoData?.id && subscriptionId && stoppedAt > 0) {
        this.subState.saveVideoStatus(videoData.id, subscriptionId, stoppedAt, false);
      }
    }
    this.destroyPlayer();
    this.subState.closeCourseVideo();
    this.videoPlayerOpen = false;
  }

  private onVideoEnded() {
    const videoData      = this.selectedVideo();
    const subscriptionId = this.subscription()?.id;
    if (videoData?.id && subscriptionId) {
      this.subState.saveVideoStatus(videoData.id, subscriptionId, 0, true);
    }
    this.destroyPlayer();
    this.subState.closeCourseVideo();
    this.videoPlayerOpen = false;
  }

  seekForward() {
    if (!this.videoElement) return;
    this.videoElement.currentTime = Math.min(this.videoElement.currentTime + 10, this.videoElement.duration || 0);
    this.flashSeek('forward');
  }

  seekBackward() {
    if (!this.videoElement) return;
    this.videoElement.currentTime = Math.max(this.videoElement.currentTime - 10, 0);
    this.flashSeek('backward');
  }

  onTouchStart(event: TouchEvent, side: 'left' | 'right') {
    event.preventDefault();
    const now = Date.now();
    if (this.lastTapSide === side && now - this.lastTapTime < 300) {
      side === 'right' ? this.seekForward() : this.seekBackward();
      this.lastTapTime = 0;
      this.lastTapSide = null;
    } else {
      this.lastTapTime = now;
      this.lastTapSide = side;
    }
  }

  private flashSeek(direction: 'forward' | 'backward') {
    if (this.seekFeedbackTimer) clearTimeout(this.seekFeedbackTimer);
    this.showSeekForward  = direction === 'forward';
    this.showSeekBackward = direction === 'backward';
    this.seekFeedbackTimer = setTimeout(() => {
      this.showSeekForward  = false;
      this.showSeekBackward = false;
    }, 700);
  }

  private initPlayer(url: string) {
    const video = this.videoElement;
    if (!video) return;

    if (this.hls) { this.hls.destroy(); this.hls = null; }

    const resumeAt = Number(this.subState.selectedVideo()?.last_time_stamp ?? 0);

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(url);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (resumeAt > 0) video.currentTime = resumeAt;
        video.play();
      });
      this.hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) this.closeVideo();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      if (resumeAt > 0) {
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = resumeAt;
        }, { once: true });
      }
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

  formatDuration(seconds: string | number): string {
    const secs = Number(seconds);
    if (isNaN(secs) || secs <= 0) return '0s';
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem  = Math.floor(secs % 60);
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  }

  getTotalDuration(videos: CourseVideo[]): string {
    const totalSecs = videos.reduce((sum, v) => sum + Number(v.durations || 0), 0);
    if (totalSecs <= 0) return '0s';
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    const rem  = Math.floor(totalSecs % 60);
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  }

  animationClass = '';
  watermarkStyle: any = {};

  ngOnInit() {
    const animations = ['move-random-1', 'move-random-2', 'move-random-3'];
    const setRandom = () => {
      this.animationClass = animations[Math.floor(Math.random() * animations.length)];
      this.watermarkStyle = {
        top:  Math.floor(Math.random() * 70) + '%',
        left: Math.floor(Math.random() * 70) + '%'
      };
    };
    setRandom();
    setInterval(setRandom, 5000);
  }
toggleFullscreen() {
  const container = this.videoContainer?.nativeElement;
  if (!container) return;

  if (!document.fullscreenElement) {
    // Try container first, fallback to video element
    const el = container as any;
    const requestFS =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;

    if (requestFS) {
      requestFS.call(el).catch((err: any) => {
        console.error('Fullscreen error:', err);
      });
    }
  } else {
    const doc = document as any;
    const exitFS =
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.msExitFullscreen;

    if (exitFS) exitFS.call(doc);
  }
}
}