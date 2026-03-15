import { inject, Injectable, signal, computed } from "@angular/core";
import { SubscriptionService } from "./subscription.service";
import { CourseDetails, CourseResponse, Profile, Subscription, SubscriptionList, UserSubscription } from "../../../../interfaces/subscriptions_interface";
import { ToastService } from "../../../../services/engine/toast.service";
import { sign } from "node:crypto";
import { LoaderService } from "../../../../services/engine/loader.service";

@Injectable({ providedIn: 'root' })
export class SubscriptionState {

    private subscriptionService = inject(SubscriptionService);
    private toastr = inject(ToastService);
    private loader = inject(LoaderService);
    // ✅ Core signals
    private _profile = signal<Profile | null>(null);
    private _subscription = signal<Subscription | null>(null);
    private _plans = signal<SubscriptionList[]>([]);

    // ✅ Loading signals
    private _profileLoading = signal(false);
    private _plansLoading = signal(false);
    private _uploading = signal(false);

    // ✅ Upload signals
    private _uploadError = signal<string | null>(null);
    private _uploadSuccess = signal(false);
    private _selectedPlanId = signal<number>(0);


    // course signals 
    private _course = signal<CourseDetails | null>(null);
    private _courseLoading = signal(false);
    private _activeVideoUrl = signal<string | null>(null);
private _videoLoading = signal(false);
private _isVideoModalOpen = signal(false);
private _selectedVideo = signal<any | null>(null);

    // ✅ Readonly exposed signals
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
// Expose readonly
readonly activeVideoUrl = this._activeVideoUrl.asReadonly();
readonly videoLoading = this._videoLoading.asReadonly();
readonly isVideoModalOpen = this._isVideoModalOpen.asReadonly();
readonly selectedVideo = this._selectedVideo.asReadonly();
    // ✅ Derived — single source of truth
    readonly subscriptionStatus = computed(() => {
        const sub = this._subscription();
        if (!sub) return null;
        return sub.status as 'active' | 'pending' | 'approved';
    });

    loadCourseDetails() {
       
        this.loader.show();

        this.subscriptionService.getCourseDetails().subscribe({
            next: (res: CourseResponse) => {
                if (res.status) {
                    this._course.set(res.data);
                }
                this.loader.hide();
            },
            error: (err) => {
                console.log("course details state erro:",err);
                this._courseLoading.set(false);
            }
        });
    }


    setSelectedPlan(planId: number) {
        this._selectedPlanId.set(planId);
    }




    resetUploadState() {
        this._uploadSuccess.set(false);
        this._uploadError.set(null);
        this._uploading.set(false);
    }



    // ✅ Step 1: Always called on page load
    loadUserProfile() {
        // if (this._profileLoading()) return;
        this._profileLoading.set(true);

        this.subscriptionService.getSubscriptionProfile().subscribe({
            next: (res) => {
                if (res.status) {
                    const data = res.data as any;
                    this._profile.set(data?.profile ?? null);
                    this._subscription.set(data?.subscription ?? null);
                    
                    console.log('RAW status from API:', data?.subscription?.status);
console.log('computed status:', this.subscriptionStatus());
                    // ✅ Scenario B: subscription null → fetch plans
                    if (data?.subscription?.status === 'active' || data?.subscription?.status === 'approved') {
                        this.loadCourseDetails();
                    }
                    else if (!data?.subscription) {
                        this.loadPlans();
                    }
                    // ✅ Scenario A: subscription exists → plans fetched
                    // but show without choose btn if pending (handled in template)
                    else if (data?.subscription?.status === 'pending') {
                        this.loadPlans(); // need to show plans without choose btn
                    }
                }
                this._profileLoading.set(false);
            },
            error: () => {
                this._profileLoading.set(false);
            }
        });
    }

    // ✅ Step 2: Fetch plans (called internally)
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
            }
        });
    }

    // ✅ Step 3: Upload image then create subscription
    uploadImage(image: File) {
        if (this._uploading()) return;
        this._uploading.set(true);
        this._uploadError.set(null);
        this._uploadSuccess.set(false);

        this.subscriptionService.uploadImage(image).subscribe({
            next: (res) => {
                if (res.status) {
                    const imageId = res.data.url.image.id;
                    const planId = this._selectedPlanId();
                    this._createSubscription(planId, imageId);
                } else {
                    this._uploadError.set('Image upload failed');
                    this._uploading.set(false);
                }
            },
            error: (err) => {
                this._uploadError.set(err.message ?? 'Upload failed');
                this._uploading.set(false);
            }
        });
    }

    // ✅ Step 4: Create subscription → update subscription signal
    private _createSubscription(planId: number, imageId: number) {
        this.subscriptionService.createUserSubscription({
            plan_id: planId,
            image_id: imageId
        }).subscribe({
            next: (res) => {
                if (res.status) {
                    // ✅ Update subscription signal directly
                    // This triggers subscriptionStatus computed automatically
                    this._subscription.set(res.data as any);
                    this._uploadSuccess.set(true);
                }
                this._uploading.set(false);
            },
            error: (err) => {
                const message: string = err.error?.message ?? '';

                if (err.status === 400 &&
                    message.toLowerCase().includes('waiting for admin approval')) {
                    this.toastr.warning('Your subscription is awaiting admin approval.');
                    this._subscription.set({ status: 'pending' } as any);
                    this._uploadSuccess.set(true);
                    this._uploading.set(false);
                    return;
                }

                this.toastr.error(message || 'Subscription failed');
                this._uploadError.set(message || 'Subscription failed');
                this._uploading.set(false);
            }
        });
    }



    // Open video — mirrors homeService.openVideo()
openCourseVideo(videoPath: string, videoData: any) {
    if (this._videoLoading()) return;
    this._selectedVideo.set(videoData);
    this._videoLoading.set(true);

    this.subscriptionService.getCourseVideoUrl(videoPath).subscribe({
        next: (res: any) => {
            if (res.status) {
                this._activeVideoUrl.set(res.data.cdn_url);
                this._isVideoModalOpen.set(true);
            }
            this._videoLoading.set(false);
        },
        error: () => {
            this._videoLoading.set(false);
        }
    });
}

closeCourseVideo() {
    this._activeVideoUrl.set(null);
    this._isVideoModalOpen.set(false);
    this._selectedVideo.set(null);
}

}