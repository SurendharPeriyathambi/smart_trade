
export interface SubResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface Subscription {
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