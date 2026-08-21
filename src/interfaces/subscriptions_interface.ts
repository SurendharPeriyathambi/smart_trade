
export interface SubResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface SubscriptionList {
  id: number;
  plan_name: string;
  amount: string;
  validity: string;
  duration: string;
  status: boolean;
}

export interface UserSubscription {
  id: number;
  status: 'active' | 'pending' |'approved' | 'rejected';
}
export interface UserSubscriptionRequest {
  plan_id: number;
  image_id: number;
}

export interface UploadedImage {
  id: number;
  title: string | null;
  media_url: string;
  created_at: string;
  updated_at: string;
}

export interface ImageUploadUrl {
  object_key: string;
  image: UploadedImage;
}

export interface ImageUploadData {
  url: ImageUploadUrl;
}
export type ImageUploadResponse = SubResponse<ImageUploadData>;

export interface Data {
  profile: Profile
  subscription: Subscription
}

export interface Profile {
  id: number
  name: string
  email: string
  mobile: string
}

export interface Subscription {
  id: number
  user_name: string
  plan_name: string
  requested_date: string
  start_date: string
  end_date: string
  renew_date: string
  status: string
  amount:string
  validity:string
  duration: string,

  is_active: boolean
}


// In your subscriptions_interface.ts — add these

export interface CourseVideo {
    id: number;
    title:string;
    image: string;
    video: string;
    durations: string;
    order_sort:number;
    is_watch: boolean;
    last_time_stamp: string;
    is_finshed: boolean;
    created_at?:string
}

export interface CourseLesson {
    id: number;
    title: string;
    is_delete: boolean;
    videos: CourseVideo[];
}

export interface CourseDetails {
    id: number;
    title: string;
    expert: string;
    image: string;
    lesson: CourseLesson[];
}

export interface CourseResponse {
    status: boolean;
    message: string;
    data: CourseDetails;
}
export interface WeeklyMeetingResponse {
  weekly_meeting: WeeklyVideos[];
}

export interface WeeklyVideos{
    title:string;
    path:string;
    thumbnail:string;
}
export interface WeeklkyVideoUrlResponce{
    cdn_url: string;
}

export interface OrderRequest{
     amount : string,
    tag:string,
    is_renew:boolean,
    plan_id:string,
    code:string
}
export interface OrderResponse{
         apiKey:string,
        orderId:string ,
      amount: string,
        receipt:string,
}
export interface DisountResponse{
         code:string,
        discount_type:string ,
        disount:number;
        value:string
     
}