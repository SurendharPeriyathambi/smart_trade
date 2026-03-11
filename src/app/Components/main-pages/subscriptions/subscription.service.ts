import { Injectable } from "@angular/core";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { Observable } from "rxjs";
import { ImageUploadResponse, SubResponse, Subscription, UserSubscription, UserSubscriptionRequest } from "../../../../interfaces/subscriptions_interface";
import { environment } from "../../../environment";

@Injectable({
    providedIn: 'root'
})



export class SubscriptionService {

    private subsUrl = 'api/subscription_list';
    private paymentUrl = 'api/common/image_upload'
    private userUrl = 'api/user_subscription'
    constructor(private http: HttpEngine) {

    }

    getSubscriptionList(): Observable<SubResponse<Subscription[]>> {
        return this.http.get<SubResponse<Subscription[]>>(this.subsUrl, true)
    }

    uploadImage(image: File): Observable<ImageUploadResponse> {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(image.type)) {
            throw new Error('Only JPG and PNG files are allowed');
        }
        const formData = new FormData();
        formData.append('image',image);
        return this.http.post<ImageUploadResponse>(this.paymentUrl,formData)
    }

    createUserSubscription(body:UserSubscriptionRequest):Observable<SubResponse<UserSubscription>>{
        return this.http.post<SubResponse<UserSubscription>>(this.userUrl,body)
    }
  
}