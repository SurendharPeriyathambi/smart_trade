import { inject, Injectable } from "@angular/core";
import { ChartRepository } from "../repositories/chart.repository";
import { CreateChart, getChartAnswer } from "../model/test.model";
import { Observable } from "rxjs";
import { Apiresponse } from "../../chartList/model/chartlist.model";


@Injectable({ providedIn: 'root' })
export class ChartUseCase {
  repo = inject(ChartRepository);
  
  // createChart(payload:CreateChart):Observable<Apiresponse<any>>{
  //   return this.repo.createChart(payload);
  // }
  getChart(payload:getChartAnswer):Observable<Apiresponse<any>>{
    return this.repo.getChart(payload);
  }

  // editChart(payload:any):Observable<Apiresponse<any>>{
  //   return this.repo.editchart(payload);
  // }
  wasabiUsecase(path: string) {
    return this.repo.getWasabiFile(path);
  }

}
