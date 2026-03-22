
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
  status: 'active' | 'pending';
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
    is_watch: boolean;
    last_time_stamp: string;
    is_finshed: boolean;
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