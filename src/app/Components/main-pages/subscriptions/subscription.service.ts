import { Injectable } from "@angular/core";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { Observable } from "rxjs";
import { CourseResponse, DisountResponse, ImageUploadResponse, OrderRequest, OrderResponse, Profile, SubResponse, SubscriptionList, UserSubscription, UserSubscriptionRequest, WeeklkyVideoUrlResponce, WeeklyMeetingResponse, WeeklyVideos } from "../../../../interfaces/subscriptions_interface";
import { environment } from "../../../environment";
import { ApiResponce, VideoUrlResponce } from "../../../../interfaces/banner_interface";

@Injectable({
    providedIn: 'root'
})



export class SubscriptionService {

    private subsUrl = 'api/subscription_list';
    private paymentUrl = 'api/common/image_upload'
    private userUrl = 'api/user_subscription'
    private weekUrl = 'api/weekly_meeting'
    constructor(private http: HttpEngine) {

    }

    getSubscriptionList(): Observable<SubResponse<SubscriptionList[]>> {
        return this.http.get<SubResponse<SubscriptionList[]>>(this.subsUrl, true)
    }

    getSubscriptionProfile(): Observable<SubResponse<Profile[]>> {
        return this.http.get<SubResponse<Profile[]>>('api/user/profile', true)
    }

    uploadImage(image: File): Observable<ImageUploadResponse> {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(image.type)) {
            throw new Error('Only JPG and PNG files are allowed');
        }
        const formData = new FormData();
        formData.append('image', image);
        return this.http.post<ImageUploadResponse>(this.paymentUrl, formData)
    }

    createUserSubscription(body: UserSubscriptionRequest): Observable<SubResponse<UserSubscription>> {
        return this.http.post<SubResponse<UserSubscription>>(this.userUrl, body)
    }


    getCourseDetails(): Observable<CourseResponse> {
        return this.http.get<CourseResponse>('api/course_details', true)
    }

    getCourseVideoUrl(videoPath: string): Observable<ApiResponce<VideoUrlResponce>> {
        return this.http.get<ApiResponce<VideoUrlResponce>>(`api/admin/v1/common/get_video?path=${videoPath}`);
    }

    unlockVideo(videoId: number, subscriptionId: number): Observable<any> {
        return this.http.post<any>('api/unlock_video', {
            video_id: videoId,
            subscription_id: subscriptionId
        });
    }
    getWasabiUrl(imagePath: string): Observable<any> {
        return this.http.get<any>(`api/common/wasabi_file?path=${imagePath}`, false);
    }
    saveVideoStatus(
        videoId: number,subscriptionId: number,duration: number,videoStatus: boolean): Observable<any> {
        return this.http.post<any>('api/video_status', {
            video_id: videoId,
            subscription_id: subscriptionId,
            duration: duration,
            video_status: videoStatus
        });
    }

    getWeekly():Observable <SubResponse<WeeklyMeetingResponse>>{
        return this.http.get<SubResponse<WeeklyMeetingResponse>>(this.weekUrl)
    }
    getWeeklyUrl(videoId:string):Observable <SubResponse<WeeklkyVideoUrlResponce>>{
        return this.http.get(`api/get_video_url?path=${videoId}`)
    }

    getOrder(payload:OrderRequest):Observable<SubResponse<OrderResponse>>{
        return  this.http.post('api/payment/order',payload)
    }
    getCouponDiscount(coupon:string):Observable<SubResponse<DisountResponse>>{
        return this.http.get<SubResponse<DisountResponse>>(`api/apply_coupon?code=${coupon}`)
    }
}