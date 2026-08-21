import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { Apiresponse } from "../../chartList/model/chartlist.model";
import { HttpClient } from "@angular/common/http";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { getChartAnswer } from "../model/drawing.model";
import { environment } from "../../../environment";

@Injectable({ providedIn: 'root' })
export class ChartService {
  private http = inject(HttpClient);
  private apiBaseUrl = 'https://chartapi.smarttradeind.com';
  private https = inject(HttpEngine);
  private env = environment.chartUrl;

  // createChart(payload:CreateChart):Observable<Apiresponse<any>>{
  //     return this.http.post<Apiresponse<CreateChart>>('/api/task/chart_answer',payload)
  // }
  // editChart(payload:EditChart):Observable<Apiresponse<any>>{
  //     return this.http.patch<Apiresponse<EditChart>>('/api/task/chart_answer_edit',payload)
  // }
  getChart(payload: getChartAnswer): Observable<Apiresponse<any>> {
    return this.http.post<Apiresponse<getChartAnswer>>(`${this.apiBaseUrl}/task/get_answer`, payload)
  }
  //   getWasabiFile(path: string) {
  //   return this.https.get<Apiresponse<any>>(`api/common/wasabi_file?path=${path}`);
  // }
  getWasabiFile(path: string) {
    return this.http.get<any>(`${this.apiBaseUrl}/common/get_json?path=${path}`);
  }
}