import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ChartRepository } from "./chart.repository";
import { ChartService } from "../service/chart.service";
import { CreateChart, getChartAnswer } from "../model/test.model";

import { EditChart } from "../model/chart.model";
import { Apiresponse } from "../../chartList/model/chartlist.model";

@Injectable({providedIn:'root'})
export class ChartRepositoryImpl implements ChartRepository {
    service=inject(ChartService);
        getWasabiFile(path: any): Observable<Apiresponse<any>> {
    return this.service.getWasabiFile(path)
  }
    // createChart(payload: CreateChart): Observable<Apiresponse<any>> {
    //     return this.service.createChart(payload);
    // }
    getChart(payload: getChartAnswer): Observable<Apiresponse<any>> {
        return this.service.getChart(payload);
    }
    // editchart(payload: EditChart): Observable<Apiresponse<any>> {
    //     return this.service.editChart(payload);
    // }
}









































































































