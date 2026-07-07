import { inject, Injectable } from "@angular/core";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { Observable } from "rxjs";
import { ApiResponce } from "../../../../interfaces/banner_interface";
import { List, ListData } from "../model/chart.model";
import { HttpClient, HttpParams ,HttpHeaders} from "@angular/common/http";
import { environment } from "../../../environment";

@Injectable({providedIn:'root'})
export class ListService {
    private http = inject(HttpClient);
    url=environment.chartUrl;

    getList():Observable<ApiResponce<ListData>>{
        const params = new HttpParams()
  .set('tag', 'active');
        return this.http.get<ApiResponce<ListData>>(`${this.url}task/list`, 
    {
      params: params
    });  
    }
}