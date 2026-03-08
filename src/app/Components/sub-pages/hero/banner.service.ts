import { Injectable } from "@angular/core";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { Observable } from "rxjs";
import { ApiResponce, HomeData, VideoUrlResponce } from "../../../../interfaces/banner_interface";

@Injectable({
    providedIn:'root'
})
export class BannerService{

    private apiUrl = "api/initial_data";
    private videoUrlApi = "api/get_video_url";

    constructor(private http : HttpEngine){

    }

    getHomeData(): Observable <ApiResponce<HomeData>>{
        return this.http.get<ApiResponce<HomeData>>(this.apiUrl);
    }

getVideoUrl(videoId:string):Observable<ApiResponce<VideoUrlResponce>>{
    return this.http.get<ApiResponce<VideoUrlResponce>>(`${this.videoUrlApi}?path=${videoId}`);
}
    
}