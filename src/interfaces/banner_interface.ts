export interface ApiResponce <T>{
    status:boolean;
    message:string;
    data:T;
}

export interface HomeData{
    banner: Banner[];
    demo_videos:DemoVideos[];
}

export interface Banner{
    title: string;
    path: string;
}

export interface DemoVideos{
    title:string;
    video_id:string;
    thumbnail:string;
}
export interface VideoUrlResponce{
    cdn_url: string;
}