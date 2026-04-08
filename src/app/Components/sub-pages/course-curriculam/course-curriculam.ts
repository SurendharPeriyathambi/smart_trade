import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';
import Hls from 'hls.js';
import { CourseLesson, CourseVideo } from '../../../../interfaces/subscriptions_interface';
import { WeeklyReport } from '../weekly-report/weekly-report';

@Component({
  selector: 'app-course-curriculam',
  imports: [CommonModule,WeeklyReport],
  templateUrl: './course-curriculam.html',
  styleUrl: './course-curriculam.scss',
})
export class CourseCurriculam {

  private subState = inject(SubscriptionState);

  // ── Signals from state ──────────────────────────────────────────────────
  course        = this.subState.course;
  courseLoading = this.subState.courseLoading;
  activeVideoUrl = this.subState.activeVideoUrl;
  videoLoading  = this.subState.videoLoading;
  selectedVideo = this.subState.selectedVideo;
  subscription  = this.subState.subscription;
  unlockedVideoIds = this.subState.unlockedVideoIds;
  videoThumbnails  = this.subState.videoThumbnails;
  unlockLoading    = this.subState.unlockLoading;
  pendingOpenIds   = this.subState.pendingOpenIds;
  profile =this.subState.profile;
  // ── Seek feedback ───────────────────────────────────────────────────────
  showSeekForward  = false;
  showSeekBackward = false;

  private lastTapTime = 0;
  private lastTapSide: 'left' | 'right' | null = null;
  private seekFeedbackTimer: any = null;

  // ── UI state ────────────────────────────────────────────────────────────
  expandedLessonId: number | null = null;
  previewVideo: CourseVideo | null = null;
  videoPlayerOpen = false;

  private hls: Hls | null = null;
  private videoElement!: HTMLVideoElement;

  // ─────────────────────────────────────────────────────────────────────────
  // ViewChild — wire video element as soon as it enters the DOM
  // ─────────────────────────────────────────────────────────────────────────

  @ViewChild('videoPlayer') set videoSetter(el: ElementRef<HTMLVideoElement> | undefined) {
    if (el) {
      this.videoElement = el.nativeElement;

      // Wire the "ended" event — fires when video plays to completion
      this.videoElement.addEventListener('ended', () => this.onVideoEnded());

      const url = this.subState.activeVideoUrl();
      if (url) this.initPlayer(url);
    }
  }

  constructor() {
    effect(() => {
      const url = this.subState.activeVideoUrl();
      if (url) {
        //    Always close preview card when video player opens
        this.previewVideo = null;
        this.videoPlayerOpen = true;
        if (this.videoElement) {
          this.initPlayer(url);
        }
      } else {
        this.destroyPlayer();
        this.videoPlayerOpen = false;
      }
    });
     effect(() => {
      const course = this.subState.course();
      if (course?.lesson?.length && this.expandedLessonId === null) {
        this.expandedLessonId = course.lesson[0].id;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lesson accordion
  // ─────────────────────────────────────────────────────────────────────────

  toggleLesson(id: number) {
    this.expandedLessonId = this.expandedLessonId === id ? null : id;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lock / unlock helpers
  // ─────────────────────────────────────────────────────────────────────────

  
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
  // Lock icon click — sequential guard + unlock → auto-open video
  // ─────────────────────────────────────────────────────────────────────────

  onLockClick(lesson: CourseLesson, video: CourseVideo, videoIndex: number) {
   
    if (!lesson || !video || video.id == null) return;
    if (this.isUnlocking(video.id)) return;

    if (!this.canUnlock(lesson, videoIndex)) {
      return;
    }

    const subscriptionId = this.subscription()?.id;
    if (!subscriptionId) {
      console.warn('onLockClick: no subscription id — subscription signal:', this.subscription());
      return;
    }

   
    this.subState.unlockAndOpenVideo(video, subscriptionId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Preview button click (is_watch === true videos)
  // ─────────────────────────────────────────────────────────────────────────

  openPreview(video: CourseVideo) {
    this.previewVideo = video;
   
    this.subState.fetchThumbnailForPreview(video.id, video.image);
  }

  closePreview() {
    this.previewVideo = null;
  }

  getThumbnail(video: CourseVideo): string {
    const wasabi = this.videoThumbnails()[video.id];
    return wasabi || video.image;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Video player — open / close / ended
  // ─────────────────────────────────────────────────────────────────────────

  playVideo(video: CourseVideo) {
    this.previewVideo = null;       // close preview card
    this.videoPlayerOpen = true;
    this.subState.openCourseVideo(video.video, video);
  }

  
  closeVideo() {
    if (this.videoElement) {
      this.videoElement.pause();

      const stoppedAt     = Math.floor(this.videoElement.currentTime);
      const videoData     = this.selectedVideo();
      const subscriptionId = this.subscription()?.id;

      if (videoData?.id && subscriptionId) {
        // Manually closed and not finished → status false, duration = stopped time
        this.subState.saveVideoStatus(
          videoData.id,
          subscriptionId,
          stoppedAt,
          false
        );
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
      // Naturally finished → status true, duration 0
      this.subState.saveVideoStatus(
        videoData.id,
        subscriptionId,
        0,
        true
      );
    }

    // Auto-close modal
    this.destroyPlayer();
    this.subState.closeCourseVideo();
    this.videoPlayerOpen = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Seek controls
  // ─────────────────────────────────────────────────────────────────────────

  seekForward() {
    if (!this.videoElement) return;
    this.videoElement.currentTime = Math.min(
      this.videoElement.currentTime + 10,
      this.videoElement.duration || 0
    );
    this.flashSeek('forward');
  }

  seekBackward() {
    if (!this.videoElement) return;
    this.videoElement.currentTime = Math.max(
      this.videoElement.currentTime - 10,
      0
    );
    this.flashSeek('backward');
  }

  onTouchStart(event: TouchEvent, side: 'left' | 'right') {
    event.preventDefault();

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (this.lastTapSide === side && now - this.lastTapTime < DOUBLE_TAP_DELAY) {
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

  // ─────────────────────────────────────────────────────────────────────────
  // HLS player
  // ─────────────────────────────────────────────────────────────────────────

  private initPlayer(url: string) {
    const video = this.videoElement;
    if (!video) return;

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    //    Read resume time from selectedVideo signal
    // last_time_stamp is '0' when finished, or seconds as string/number
    const selectedVid = this.subState.selectedVideo();
    const resumeAt = Number(selectedVid?.last_time_stamp ?? 0);

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(url);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        //    Seek to resume point before playing
        if (resumeAt > 0) {
          video.currentTime = resumeAt;
        }
        video.play();
      });
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          this.closeVideo();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      //    Native HLS (Safari) — seek after metadata loads
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

  // ─────────────────────────────────────────────────────────────────────────
  // Duration helpers
  // ─────────────────────────────────────────────────────────────────────────

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

}