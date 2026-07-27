import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ChartRepository } from "./chart.repository";
import { ChartService } from "../service/chart.service";
import { Apiresponse } from "../../chartList/model/chartlist.model";
import { getChartAnswer } from "../model/drawing.model";

@Injectable({providedIn:'root'})
export class ChartRepositoryImpl implements ChartRepository {
    service=inject(ChartService);
        getWasabiFile(path: any): Observable<Apiresponse<any>> {
    return this.service.getWasabiFile(path)
  }
    getChart(payload: getChartAnswer): Observable<Apiresponse<any>> {
        return this.service.getChart(payload);
    }
}









































































































