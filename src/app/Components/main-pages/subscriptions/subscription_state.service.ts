import { inject, Injectable, signal, computed } from '@angular/core';
import { SubscriptionService } from './subscription.service';
import {
  CourseDetails,
  CourseResponse,
  CourseVideo,
  Profile,
  Subscription,
  SubscriptionList,
  UserSubscription,
  WeeklyVideos,
} from '../../../../interfaces/subscriptions_interface';
import { ToastService } from '../../../../services/engine/toast.service';
import { LoaderService } from '../../../../services/engine/loader.service';
import { sign } from 'crypto';
import { finalize, map, Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SubscriptionState {
  private _isOpeningVideo = false; // ← add this private field

  private subscriptionService = inject(SubscriptionService);
  private toastr = inject(ToastService);
  private loader = inject(LoaderService);

  //   Core signals
  private _profile = signal<Profile | null>(null);
  private _subscription = signal<Subscription | null>(null);
  private _plans = signal<SubscriptionList[]>([]);

  //   Loading signals
  private _profileLoading = signal(false);
  private _plansLoading = signal(false);
  private _uploading = signal(false);

  //   Upload signals
  private _uploadError = signal<string | null>(null);
  private _uploadSuccess = signal(false);
  private _selectedPlanId = signal<number>(0);

  // Course signals
  private _course = signal<CourseDetails | null>(null);
  private _courseLoading = signal(false);
  private _activeVideoUrl = signal<string | null>(null);
  private _videoLoading = signal(false);
  private _isVideoModalOpen = signal(false);
  private _selectedVideo = signal<any | null>(null);

  // Unlock / thumbnail signals
  private _unlockedVideoIds = signal<Set<number>>(new Set());
  private _videoThumbnails = signal<Record<number, string>>({});
  private _unlockLoading = signal<number | null>(null);
  private _WeekVideos = signal<WeeklyVideos[]>([]);
  private weekactiveVideoUrl = signal<string | null>(null);
  private isModalOpen = signal(false);
  private weekvideoLoading = signal(false);
  readonly weekVideos = this._WeekVideos.asReadonly();
  readonly activeVideoUrls = this.weekactiveVideoUrl.asReadonly();
  readonly isModalOpens = this.isModalOpen.asReadonly();
  readonly videoLoadings = this.weekvideoLoading.asReadonly();
  // Tracks video ids that are unlocked but player is still loading
  // During this window we show spinner, not preview btn
  private _pendingOpenIds = signal<Set<number>>(new Set());
  readonly pendingOpenIds = this._pendingOpenIds.asReadonly();

  readonly profile = this._profile.asReadonly();
  readonly subscription = this._subscription.asReadonly();
  readonly plans = this._plans.asReadonly();
  readonly profileLoading = this._profileLoading.asReadonly();
  readonly plansLoading = this._plansLoading.asReadonly();
  readonly isUploading = this._uploading.asReadonly();
  readonly uploadError = this._uploadError.asReadonly();
  readonly isUploadSuccess = this._uploadSuccess.asReadonly();
  readonly course = this._course.asReadonly();
  readonly courseLoading = this._courseLoading.asReadonly();
  readonly activeVideoUrl = this._activeVideoUrl.asReadonly();
  readonly videoLoading = this._videoLoading.asReadonly();
  readonly isVideoModalOpen = this._isVideoModalOpen.asReadonly();
  readonly selectedVideo = this._selectedVideo.asReadonly();
  readonly unlockedVideoIds = this._unlockedVideoIds.asReadonly();
  readonly videoThumbnails = this._videoThumbnails.asReadonly();
  readonly unlockLoading = this._unlockLoading.asReadonly();

  //   Derived — single source of truth
  readonly subscriptionStatus = computed(() => {
    const sub = this._subscription();
    if (!sub) return null;
    return sub.status.toLowerCase() as 'active' | 'pending' | 'approved' | 'rejected';
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Course loading
  // ─────────────────────────────────────────────────────────────────────────


  loadCourseDetails() {
    this.loader.show();

    this.subscriptionService.getCourseDetails().subscribe({
      next: (res: CourseResponse) => {
        if (res.status) {
         
          this._course.set(res.data);
          //   Pre-populate unlocked set from is_watch on every load
          this._seedUnlockedFromCourse(res.data);
        }
        this.loader.hide();
      },
      error: (err) => {
        this._courseLoading.set(false);
        this.loader.hide();
      },
    });

    this.subscriptionService.getWeekly().subscribe({
      next: (res) => {
        if (res.status) {
          this._WeekVideos.set(res.data.weekly_meeting ?? []);
        }
        this.loader.hide();
      },
      error: (err) => {
        this.weekvideoLoading.set(false);
        this.loader.hide();
      },
    });
  }
  openWeeklyVideo(video_id: string) {
    if (this.videoLoading()) return;

    this.weekvideoLoading.set(true);
    this.loader.show()
    this.subscriptionService.getWeeklyUrl(video_id).subscribe({
      next: (res) => {
        if (res.status) {
          this.weekactiveVideoUrl.set(res.data);
          this.isModalOpen.set(true);
           this.loader.hide()
        }
        this.weekvideoLoading.set(false);
         this.loader.hide()
      },
      error: () => this.weekvideoLoading.set(false),
    });
  }

  closeWeeklyVideo() {
    this.weekactiveVideoUrl.set(null);
    this.isModalOpen.set(false);
  }

  private _seedUnlockedFromCourse(course: CourseDetails) {
    const current = new Set(this._unlockedVideoIds());
    for (const lesson of course.lesson) {
      for (const video of lesson.videos) {
        if (video.is_watch) {
          current.add(video.id);
        }
      }
    }
    this._unlockedVideoIds.set(current);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sequential unlock guard
  // ─────────────────────────────────────────────────────────────────────────

  canUnlockVideo(lessonId: number, videoIndex: number): boolean {
    if (videoIndex === 0) return true;
    const course = this._course();
    if (!course) return false;
    const lesson = course.lesson.find((l) => l.id === lessonId);
    if (!lesson) return false;
    const previousVideo = lesson.videos[videoIndex - 1];
    return !!previousVideo && this._unlockedVideoIds().has(previousVideo.id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Unlock flow — now opens video directly on success
  // ─────────────────────────────────────────────────────────────────────────

  // unlockAndOpenVideo(video: CourseVideo, subscriptionId: number) {
  //     if (this._unlockLoading() === video.id) return;
  //     this._unlockLoading.set(video.id);

  //     this.subscriptionService.unlockVideo(video.id, subscriptionId).subscribe({
  //         next: (res: any) => {
  //             if (res.status) {
  //                 //   Mark as pending-open BEFORE adding to unlockedVideoIds
  //                 // This keeps the lock spinner visible (not preview btn) while CDN url loads
  //                 const pending = new Set(this._pendingOpenIds());
  //                 pending.add(video.id);
  //                 this._pendingOpenIds.set(pending);

  //                 //   Add to unlocked set (needed for sequential unlock of next video)
  //                 const current = new Set(this._unlockedVideoIds());
  //                 current.add(video.id);
  //                 this._unlockedVideoIds.set(current);

  //                 //   Open video — pendingOpenIds cleared inside openCourseVideo on success
  //                 this.openCourseVideo(video.video, video, video.id);
  //             }
  //             this._unlockLoading.set(null);
  //         },
  //         error: () => {
  //             this._unlockLoading.set(null);
  //         }
  //     });
  // }
  unlockAndOpenVideo(
  video: CourseVideo,
  subscriptionId: number
): Observable<string | null> {

  if (this._unlockLoading() !== null) {
    return of(null);
  }

  this._unlockLoading.set(video.id);
  this.loader.show();

  return this.subscriptionService
    .unlockVideo(video.id, subscriptionId)
    .pipe(
      switchMap((res: any) => {

        if (!res.status) {
          return of(null);
        }

        return this.openCourseVideo(
          video.video,
          video
        );
      }),

      finalize(() => {
        this._unlockLoading.set(null);
        this.loader.hide();
      })
    );
}

  fetchThumbnailForPreview(videoId: number, imagePath: string) {
    // Already cached — skip
    if (this._videoThumbnails()[videoId]) return;

    this.subscriptionService.getWasabiUrl(imagePath).subscribe({
      next: (thumbRes: any) => {
        if (thumbRes.status) {
          const current = { ...this._videoThumbnails() };
          current[videoId] = thumbRes.data.wasabi_url;
          this._videoThumbnails.set(current);
        }
      },
      error: () => {
        /* silently ignore */
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Video player
  // ─────────────────────────────────────────────────────────────────────────

 openCourseVideo(
  videoPath: string,
  videoData: CourseVideo
): Observable<string | null> {

  this._isOpeningVideo = true;

  const freshVideo =
    this._getFreshVideoData(videoData.id) ?? videoData;
  this.loader.show();
  this._selectedVideo.set(freshVideo);
  this._videoLoading.set(true);

  return this.subscriptionService
    .getCourseVideoUrl(videoPath)
    .pipe(
      map((res: any) => {

        this._isOpeningVideo = false;
        this._videoLoading.set(false);

        if (!res.status) {
          return null;
        }

        this._activeVideoUrl.set(res.data);

        const current =
          new Set(this._unlockedVideoIds());

        current.add(videoData.id);

        this._unlockedVideoIds.set(current);

        this.loader.hide();
        return res.data;
      })
    );
}

  private _getFreshVideoData(videoId: number): CourseVideo | null {
    const course = this._course();
    if (!course) return null;
    for (const lesson of course.lesson) {
      const found = lesson.videos.find((v) => v.id === videoId);
      if (found) return found;
    }
    return null;
  }

  closeCourseVideo() {
    this._isOpeningVideo = false; // ← reset on close
    this._activeVideoUrl.set(null);
    this._isVideoModalOpen.set(false);
    this._selectedVideo.set(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Video status save + local state update
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Saves video watch status to backend, then updates local course signal
   * so UI reflects the change without a page refresh.
   *
   * @param videoId       - the video's id
   * @param subscriptionId
   * @param duration      - seconds elapsed (0 when finished naturally)
   * @param videoStatus   - true = finished, false = manually closed
   */
  saveVideoStatus(videoId: number, subscriptionId: number, duration: number, videoStatus: boolean) {
    this.subscriptionService
      .saveVideoStatus(videoId, subscriptionId, duration, videoStatus)
      .subscribe({
        next: (res) => {
          if (res.status) {
            //   Update local course data to avoid full refresh
            if (videoStatus) {
              // Naturally finished
              this._updateLocalVideoField(videoId, {
                is_watch: true,
                is_finshed: true,
                last_time_stamp: '0',
              });
            } else {
              // Manually closed mid-way
              this._updateLocalVideoField(videoId, {
                is_watch: true,
                is_finshed: false,
                last_time_stamp: String(duration),
              });
            }
            //  Ensure it's in the unlocked set too
            const current = new Set(this._unlockedVideoIds());
            current.add(videoId);
            this._unlockedVideoIds.set(current);
          } else {
          }
        },
        error: (err) => {},
      });
  }

  private _updateLocalVideoField(videoId: number, patch: Partial<CourseVideo>) {
    const course = this._course();
    if (!course) return;

    const updatedLessons = course.lesson.map((lesson) => ({
      ...lesson,
      videos: lesson.videos.map((video) => (video.id === videoId ? { ...video, ...patch } : video)),
    }));

    this._course.set({ ...course, lesson: updatedLessons });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Profile / plans / subscription
  // ─────────────────────────────────────────────────────────────────────────

  setSelectedPlan(planId: number) {
    this._selectedPlanId.set(planId);
  }

  resetUploadState() {
    this._uploadSuccess.set(false);
    this._uploadError.set(null);
    this._uploading.set(false);
  }

  loadUserProfile() {
    this._profileLoading.set(true);

    this.subscriptionService.getSubscriptionProfile().subscribe({
      next: (res) => {
        if (res.status) {
          const data = res.data as any;
          this._profile.set(data?.profile ?? null);

          const rawSub = data?.subscription ?? null;
          if (rawSub?.status) {
            rawSub.status = rawSub.status.toLowerCase();
          }
          this._subscription.set(rawSub);
          if (
            data?.subscription?.status === 'active' ||
            data?.subscription?.status === 'approved'
          ) {
            this.loadCourseDetails();
          } else if (!data?.subscription) {
            this.loadPlans();
          } else if (
            data?.subscription?.status === 'pending' ||
            data?.subscription?.status === 'rejected'
          ) {
            this.loadPlans();
          }
        }
        this._profileLoading.set(false);
      },
      error: () => {
        this._profileLoading.set(false);
      },
    });
  }

  private loadPlans() {
    if (this._plansLoading()) return;
    this.loader.show();

    this.subscriptionService.getSubscriptionList().subscribe({
      next: (res) => {
        if (res.status) {
          this._plans.set(res.data ?? []);
        }
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
      },
    });
  }
loadPlansForRenewal() {
  this.loadPlans();
}
  uploadImage(image: File) {
    if (this._uploading()) return;
    this._uploading.set(true);
    this._uploadError.set(null);
    this._uploadSuccess.set(false);

    this.subscriptionService.uploadImage(image).subscribe({
      next: (res) => {
        if (res.status) {
          this.toastr.success('Screenshot uploaded successfully!');
          const imageId = res.data.url.image.id;
          const planId = this._selectedPlanId();
          this._createSubscription(planId, imageId);
        } else {
          this.toastr.error('Image upload failed');
          this._uploadError.set('Image upload failed');
          this._uploading.set(false);
        }
      },
      error: (err) => {
        this.toastr.error(err.message ?? 'Upload failed');
        this._uploadError.set(err.message ?? 'Upload failed');
        this._uploading.set(false);
      },
    });
  }

  private _createSubscription(planId: number, imageId: number) {
    this.subscriptionService
      .createUserSubscription({
        plan_id: planId,
        image_id: imageId,
      })
      .subscribe({
        next: (res) => {
          if (res.status) {
            this.toastr.success('Subscription created! Awaiting approval.');
            this._subscription.set(res.data as any);
            this._uploadSuccess.set(true);
          }
          this._uploading.set(false);
        },
        error: (err) => {
          const message: string = err.error?.message ?? '';

          if (err.status === 400 && message.toLowerCase().includes('waiting for admin approval')) {
            this.toastr.warning('Your subscription is awaiting admin approval.');
            this._subscription.set({ status: 'pending' } as any);
            this._uploadSuccess.set(true);
            this._uploading.set(false);
            return;
          }

          this.toastr.error(message || 'Subscription failed');
          this._uploadError.set(message || 'Subscription failed');
          this._uploading.set(false);
        },
      });
  }

  
}
