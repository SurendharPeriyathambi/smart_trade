import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponce } from "../../../../interfaces/banner_interface";
import { ListData } from "../model/chart.model";
import { HttpClient, HttpParams } from "@angular/common/http";


@Injectable({providedIn:'root'})
export class ListService {
    private http = inject(HttpClient);
    url="";

    getList():Observable<ApiResponce<ListData>>{
        const params = new HttpParams()
  .set('tag', 'active');
        return this.http.get<ApiResponce<ListData>>(`task/list`, 
    {
      params: params
    });  
    }
}