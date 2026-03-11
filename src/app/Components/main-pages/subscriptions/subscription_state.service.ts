import { inject, Injectable, signal } from "@angular/core";
import { SubscriptionService } from "./subscription.service";
import { Subscription, UserSubscription } from "../../../../interfaces/subscriptions_interface";
import { ToastService } from "../../../../services/engine/toast.service";

@Injectable({ providedIn: 'root' })
export class SubscriptionState {

    private subscriptionService = inject(SubscriptionService);
    private toastr = inject(ToastService);
    // Subscription list
    private subscriptions = signal<Subscription[]>([]);
    private loading = signal(false);
    private error = signal<string | null>(null);
    private userSubscription = signal<UserSubscription | null>(null);

    // Upload
    private uploading = signal(false);
    private uploadError = signal<string | null>(null);
    private uploadSuccess = signal(false);

    // ✅ User subscription result
    private userSubscriptionStatus = signal<'active' | 'pending' | null>(null);
    private selectedPlanId = signal<number>(0);  // ✅ stored when user clicks Choose

    // Readonly
    readonly subscription = this.subscriptions.asReadonly();
    readonly currentUserSubscription = this.userSubscription.asReadonly();

    readonly loadings = this.loading.asReadonly();
    readonly errors = this.error.asReadonly();
    readonly isUploading = this.uploading.asReadonly();
    readonly uploadErrors = this.uploadError.asReadonly();
    readonly isUploadSuccess = this.uploadSuccess.asReadonly();
    readonly subscriptionStatus = this.userSubscriptionStatus.asReadonly(); // ✅ 'active' | 'pending' | null

    // ✅ Called from parent when user clicks Choose on a plan
    setSelectedPlan(planId: number) {
        this.selectedPlanId.set(planId);
    }

    getSubscriptionList() {
        if (this.loading()) return;
        this.loading.set(true);
        this.error.set(null);

        this.subscriptionService.getSubscriptionList().subscribe({
            next: (res) => {
                if (res.status) {
                    this.subscriptions.set(res.data ?? []);
                }
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(err.message ?? 'Failed to load data');
                this.loading.set(false);
            }
        });
    }

    // ✅ Step 1: upload image → Step 2: create user subscription
    uploadImage(image: File) {
        if (this.uploading()) return;
        this.uploading.set(true);
        this.uploadError.set(null);
        this.uploadSuccess.set(false);

        this.subscriptionService.uploadImage(image).subscribe({
            next: (res) => {
                if (res.status) {
                   
                    const imageId = res.data.url.image.id;      
                    const planId = this.selectedPlanId();        
                    this.createUserSubscription(planId, imageId); 
                } else {

                    this.uploadError.set('Image upload failed');
                    this.uploading.set(false);
                }
            },
            error: (err) => {
                console.log('❌ Upload error:', err.status, err.error);
                this.uploadError.set(err.message ?? 'Upload failed');
                this.uploading.set(false);
            }
        });
    }

    private createUserSubscription(planId: number, imageId: number) {
        console.log('📦 Calling user_subscription with:', { plan_id: planId, image_id: imageId });
        this.subscriptionService.createUserSubscription({
            plan_id: planId,
            image_id: imageId
        }).subscribe({
            next: (res) => {
                console.log('✅ UserSubscription response:', res);
                if (res.status) {
                    this.userSubscription.set(res.data);
                    this.userSubscriptionStatus.set(res.data.status);
                    this.uploadSuccess.set(true);
                }
                this.uploading.set(false);
            },
            error: (err) => {
                const message: string = err.error?.message ?? '';

                if (err.status === 400 && message.toLowerCase().includes('waiting for admin approval')) {
                    this.toastr.warning('Your subscription is awaiting admin approval.'); // ✅ toast
                    this.userSubscriptionStatus.set('pending');
                    this.uploadSuccess.set(true);
                    this.uploading.set(false);
                    return;
                }
                if (err.status === 400 && message.toLowerCase().includes('waiting for admin approval')) {
                    this.toastr.warning('Your subscription is awaiting admin approval.'); // ✅ toast
                    this.userSubscriptionStatus.set('pending');
                    this.uploadSuccess.set(true);
                    this.uploading.set(false);
                    return;
                }
                this.toastr.error(message || 'Subscription failed');
                console.log('❌ UserSubscription error:', err.status, err.error);
                this.uploadError.set(message || 'Subscription failed');
                this.uploading.set(false);
            }
        });
    }
}