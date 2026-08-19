import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  effect,
  ChangeDetectorRef,
  signal,
  OnInit,
  OnDestroy,
  computed,
  AfterViewInit,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';
import { CourseLesson, CourseVideo } from '../../../../interfaces/subscriptions_interface';
import { WeeklyReport } from '../weekly-report/weekly-report';
import { AuthStateService } from '../../main-pages/login/auth-state.service';
import { ChartList } from '../../chartList/chartlist';
import { environment } from '../../../environment';
import * as iframeApiLoader from '@kinescope/player-iframe-api-loader';
import { VideoPlayerComponent, VideoStatus } from '../video-container/video-container';
import { CustomPlayer, VideoPlayerData } from '../CustomPlayer/CustomPlayer';
import { log } from 'console';
import { LoaderService } from '../../../../services/engine/loader.service';

@Component({
  selector: 'app-course-curriculam',
  imports: [CommonModule, WeeklyReport, ChartList, VideoPlayerComponent, CustomPlayer],
  templateUrl: './course-curriculam.html',
  styleUrl: './course-curriculam.scss',
})
export class CourseCurriculam implements OnInit, AfterViewInit {
  videoId = signal(0);
  private loaderService = inject(LoaderService);
  videoUrl: string | null = null;
  startTime = signal(0);
  watermarkTop = signal(20);
  watermarkLeft = signal(20);
  @ViewChild('videoContainer')
  videoContainer!: ElementRef<HTMLElement>;
  @ViewChild('kinescopeIframe')
  kinescopeIframe!: ElementRef<HTMLIFrameElement>;
  protected readonly title = signal('angular-application');
  private watermarkInterval?: ReturnType<typeof setInterval>;
  // in your component
  private player: any = null;
  public env = environment.apiUrl;
  lastUpdated = 'Dec 25, 2025';

  private subState = inject(SubscriptionState);
  private authState = inject(AuthStateService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  watermarkVisible = true;

  course = this.subState.course;
  courseLoading = this.subState.courseLoading;
  activeVideoUrl = this.subState.activeVideoUrl;
  videoLoading = this.subState.videoLoading;
  selectedVideo = this.subState.selectedVideo;
  subscription = this.subState.subscription;
  loginIp = this.authState.ip;
  unlockedVideoIds = this.subState.unlockedVideoIds;
  videoThumbnails = this.subState.videoThumbnails;
  unlockLoading = this.subState.unlockLoading;
  pendingOpenIds = this.subState.pendingOpenIds;
  profile = this.subState.profile;

  expandedLessonId: number | null = null;
  previewVideo: CourseVideo | null = null;
  videoPlayerOpen = false;
  showPlayer = false;

  // Cache the sanitized embed URL so we don't re-sanitize on every change
  // detection cycle (Angular treats a new SafeResourceUrl instance as a
  // change even if the underlying string is identical).
  private _safeVideoUrl: SafeResourceUrl | null = null;
  private _lastRawUrl: string | null = null;
  moveWatermark(): void {
    const top = Math.floor(Math.random() * 75) + 10;
    const left = Math.floor(Math.random() * 75) + 10;
    this.watermarkTop.set(top);
    this.watermarkLeft.set(left);
  }
  // async fullscreen(): Promise<void> {
  //   await this.videoContainer.nativeElement.requestFullscreen();
  // }

  constructor() {

    effect(() => {
      const url = this.subState.activeVideoUrl();
      if (url) {
        // this.previewVideo = null;
        // this.videoPlayerOpen = true;
        // this.cdr.detectChanges();
      } else {
        this.videoPlayerOpen = false;
        this._safeVideoUrl = null;
        this._lastRawUrl = null;
        this.cdr.detectChanges();
      }
    });

    effect(() => {
      const course = this.subState.course();
      if (course?.lesson?.length && this.expandedLessonId === null) {
        this.expandedLessonId = course.lesson[0].id;
      }
    });

    // // Listen for fullscreen change (e.g. user presses Escape)
    // document.addEventListener('fullscreenchange', () => {
    //   this.isFullscreen = !!document.fullscreenElement;
    //   this.cdr.detectChanges();
    // });
  }
  fullscreen(): void {
    const element = this.videoContainer?.nativeElement;

    if (!element) {
      console.error('Video container not found');

      return;
    }

    // Already fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((error) => {
        console.error('Exit fullscreen failed:', error);
      });

      return;
    }

    // Enter fullscreen
    element.requestFullscreen().catch((error) => {
      console.error('Fullscreen failed:', error);
    });
  }


  openPreview(video: CourseVideo) {
    this.previewVideo = video;
    this.subState.fetchThumbnailForPreview(video.id, video.image);
  }

  closePreview() {
    this.videoUrl = null;
    this.subState.closeCourseVideo();
    this.videoPlayerOpen = false;
    this.previewVideo = null;
  }

  getThumbnail(video: CourseVideo): string {
    return `${this.env}${video.image}`;
  }

  playVideo(video: CourseVideo) {
    console.log('Video clicked');
    // this.videoPlayerOpen = true;
    this.cdr.detectChanges();
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
  // Embed URL — sanitized for the iframe [src] binding
  // ─────────────────────────────────────────────────────────────────────────
  safeVideoUrl() {
    const url = this.activeVideoUrl();
    // this.cdr.detectChanges();
    // if (!url) return null;

    if (url !== this._lastRawUrl) {
      this._lastRawUrl = url;
      this.cdr.detectChanges();
      // this._safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    console.log(this._lastRawUrl);
    return this._lastRawUrl;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Close video
  // ─────────────────────────────────────────────────────────────────────────
  closeVideo() {
    // NOTE: with an iframe embed we no longer have direct access to
    // currentTime/duration unless Kinescope's postMessage API is wired up.
    // Resume-position tracking (saveVideoStatus) is skipped here — add it
    // back once/if that integration exists.
    this.videoUrl = null;
    this.subState.closeCourseVideo();
    this.videoPlayerOpen = false;
  }

  formatDuration(seconds: string | number): string {
    const secs = Number(seconds);
    if (isNaN(secs) || secs <= 0) return '0s';
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  }

  getTotalDuration(videos: CourseVideo[]): string {
    const totalSecs = videos.reduce((sum, v) => sum + Number(v.durations || 0), 0);
    if (totalSecs <= 0) return '0s';
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    const rem = Math.floor(totalSecs % 60);
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  }

  animationClass = '';
  watermarkStyle: any = {};

  ngOnInit() {
    const animations = ['move-random-1', 'move-random-2', 'move-random-3'];
    const setRandom = () => {
      this.animationClass = animations[Math.floor(Math.random() * animations.length)];
      this.watermarkStyle = {
        top: Math.floor(Math.random() * 70) + '%',
        left: Math.floor(Math.random() * 70) + '%',
      };
    };
    setRandom();
    setInterval(setRandom, 6000);
    this.moveWatermark();

    this.watermarkInterval = setInterval(() => {
      this.moveWatermark();
    }, 5000);
    // Listen for browser fullscreen changes
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }
  async ngAfterViewInit(): Promise<void> { }

  toggleFullscreen() {
    const container = this.videoContainer?.nativeElement;
    if (!container) return;

    if (!document.fullscreenElement) {
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

  // ─────────────────────────────────────────────────────────────────────────
  // "NEW" badge logic
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * A video counts as "new" only if it was created today AND the user
   * hasn't unlocked it yet. Once unlocked, the badge disappears even if
   * it was created today.
   */
  isNewVideo(video: CourseVideo | any): boolean {
    if (!video?.created_at) return false;
    if (this.isUnlocked(video.id)) return false;

    const created = new Date(video.created_at);
    const now = new Date();
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate() &&
      video?.is_watch === false

    );
  }

  /** Used for the section-header "New" badge — true if any video in this lesson is still new. */
  sectionHasNewVideo(videos: CourseVideo[] | undefined): boolean {
    if (!videos?.length) return false;
    return videos.some((v) => this.isNewVideo(v));
  }

  /**
   * Returns the lesson's videos with any "new" (unwatched + created today)
   * videos moved to the front. Sort is stable, so relative order is
   * preserved both within the new group and within the rest.
   */
  getSortedVideos(videos: CourseVideo[] | undefined): CourseVideo[] {
    if (!videos?.length) return [];

    return [...videos].sort((a, b) => {
      return a?.order_sort - b?.order_sort;
    });
  }

  getLatestCreatedDate(lessons: CourseLesson[] | undefined): string {
    if (!lessons?.length) {
      return '';
    }

    const videos = lessons.flatMap((lesson) => lesson.videos ?? []);

    if (!videos.length) {
      return '';
    }

    let latestDate: Date | null = null;

    for (const video of videos) {
      if (!video.created_at) {
        continue;
      }

      const currentDate = new Date(video.created_at);

      if (!latestDate || currentDate > latestDate) {
        latestDate = currentDate;
      }
    }

    if (!latestDate) {
      return '';
    }

    return latestDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  onThumbClick(video: any): void {
    if (video.is_watch) {
      this.subState.openCourseVideo(video.video, video).subscribe((url) => {
        if (!url) {
          return;
        }
        console.log('Opening player with:', url);
        this.videoId.set(video?.id);
        this.videoUrl = url;
        this.videoPlayerOpen = true;
        this.startTime.set(video.is_finshed ? 0 : video?.last_time_stamp)
      });
    } else {
      const subscriptionId = this.subscription()?.id;

      if (!subscriptionId) {
        return;
      }
      this.videoId.set(video?.id);

      this.subState.unlockAndOpenVideo(video, subscriptionId).subscribe((url: any) => {
        if (!url) {
          return;
        }
        console.log('Opening player with:', url);
        this.videoId.set(video?.id);
        this.videoUrl = url;
        this.videoPlayerOpen = true;
        this.startTime.set(0);
      })

    }
  }
  //video details
  currentTime = signal(0);

  duration = signal(0);

  pauseTime = signal(0);

  progress = signal(0);

  lastEvent = signal('');
  isFullscreen = signal(false);
  private handleFullscreenChange = (): void => {
    const container = this.videoContainer?.nativeElement;

    this.isFullscreen.set(document.fullscreenElement === container);
  };

  // =========================================================
  // PLAYER EVENTS
  // =========================================================

  setupPlayerEvents(): void {
    if (!this.player) {
      console.error('Kinescope player not available');

      return;
    }

    // =======================================================
    // PLAY
    // =======================================================

    this.player.on(this.player.Events.Play, () => {
      this.lastEvent.set('play');

      console.log('Video play');
    });

    // =======================================================
    // PLAYING
    // =======================================================

    if (this.player.Events.Playing) {
      this.player.on(this.player.Events.Playing, () => {
        this.lastEvent.set('playing');
      });
    }

    // =======================================================
    // TIME UPDATE
    // =======================================================

    this.player.on(this.player.Events.TimeUpdate, (event: any) => {
      const currentTime = event?.data?.currentTime;

      const percent = event?.data?.percent;

      // Current time
      if (typeof currentTime === 'number') {
        this.currentTime.set(currentTime);
      }

      // Progress
      if (typeof percent === 'number') {
        this.progress.set(percent);
      } else {
        this.updateProgress();
      }

      this.lastEvent.set('timeupdate');
    });

    // =======================================================
    // PAUSE
    // =======================================================

    this.player.on(this.player.Events.Pause, async () => {
      try {
        const currentTime = await this.player.getCurrentTime();

        const time = Number(currentTime) || 0;

        // Update current time
        this.currentTime.set(time);

        // Save pause time
        this.pauseTime.set(time);

        // Update progress
        this.updateProgress();

        // Last event
        this.lastEvent.set('pause');

        console.log('Video paused at:', time, 'seconds');

        /*
         * Save to backend here:
         *
         * this.saveVideoStatus(
         *   this.videoId,
         *   time
         * );
         */
      } catch (error) {
        console.error('Pause time error:', error);
      }
    });

    // =======================================================
    // ENDED
    // =======================================================

    this.player.on(this.player.Events.Ended, async () => {
      try {
        const duration = await this.player.getDuration();

        const total = Number(duration) || 0;

        this.duration.set(total);

        this.currentTime.set(total);

        this.pauseTime.set(total);

        this.progress.set(100);

        this.lastEvent.set('ended');

        console.log('Video ended');
      } catch (error) {
        console.error('Ended error:', error);

        this.progress.set(100);

        this.lastEvent.set('ended');
      }
    });

    // =======================================================
    // ERROR
    // =======================================================

    if (this.player.Events.Error) {
      this.player.on(this.player.Events.Error, (event: any) => {
        console.error('KINESCOPE ERROR:', event);

        this.lastEvent.set('error');
      });
    }
  }

  // =========================================================
  // INITIAL VALUES
  // =========================================================

  async loadInitialValues(): Promise<void> {
    if (!this.player) {
      return;
    }

    try {
      // Get duration
      const duration = await this.player.getDuration();

      // Get current time
      const currentTime = await this.player.getCurrentTime();

      // Set duration
      this.duration.set(Number(duration) || 0);

      // Set current time
      this.currentTime.set(Number(currentTime) || 0);

      // Calculate progress
      this.updateProgress();

      this.lastEvent.set('ready');
    } catch (error) {
      console.error('Initial values error:', error);
    }
  }

  // =========================================================
  // UPDATE PROGRESS
  // =========================================================

  updateProgress(): void {
    const total = this.duration();

    const current = this.currentTime();

    if (total <= 0) {
      this.progress.set(0);

      return;
    }

    const percentage = (current / total) * 100;

    this.progress.set(Math.min(100, Math.max(0, percentage)));
  }

  // =========================================================
  // DESTROY
  // =========================================================

  onVideoClosed(data: VideoPlayerData): void {
    console.log('========== VIDEO CLOSED ==========');

    console.log('Current Time:', data.currentTime);

    console.log('Duration:', data.duration);

    console.log('Percentage:', data.percent);

    console.log('Watermark:', data.watermarkLabel);

    console.log('Video URL:', data.videoUrl);

    this.videoPlayerOpen = false;
    const subscriptionId = this.subscription()?.id;
    if (!subscriptionId) return;
    const seconds = Math.floor(data.currentTime);

    console.log(seconds);
    this.subState.saveVideoStatus(this.videoId(), subscriptionId, seconds, true);
  }
  onVideoPaused(data: VideoPlayerData): void {
    console.log('========== VIDEO PAUSED ==========');

    console.log('Current Time:', data.currentTime);

    console.log('Duration:', data.duration);

    console.log('Percentage:', data.percent);

    console.log('Watermark:', data.watermarkLabel);

    console.log('Video URL:', data.videoUrl);
    const subscriptionId = this.subscription()?.id;
    if (!subscriptionId) return;
    const seconds = Math.floor(data.currentTime);

    console.log(seconds);
    this.subState.saveVideoStatus(this.videoId(), subscriptionId, seconds, true);
    /**
     * Send pause information
     * to your Lumen API.
     */
  }
}
