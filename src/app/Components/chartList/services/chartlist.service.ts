import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponce } from '../../../../interfaces/banner_interface';
import { ListData } from '../model/chartlist.model';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class ListService {
  private http = inject(HttpClient);

  getList(): Observable<ApiResponce<ListData>> {
    return this.http.get<ApiResponce<ListData>>(environment.chartUrl+'task/list?tag=active');
  }
}
