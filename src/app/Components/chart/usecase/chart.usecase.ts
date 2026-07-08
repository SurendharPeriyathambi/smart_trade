import { inject, Injectable } from "@angular/core";
import { ChartRepository } from "../repositories/chart.repository";
import { getChartAnswer } from "../model/drawing.model";
import { Observable } from "rxjs";
import { Apiresponse } from "../../chartList/model/chartlist.model";

@Injectable({ providedIn: 'root' })
export class ChartUseCase {
  repo = inject(ChartRepository);

  getChart(payload: getChartAnswer): Observable<Apiresponse<any>> {
    return this.repo.getChart(payload);
  }

  wasabiUsecase(path: string) {
    return this.repo.getWasabiFile(path);
  }
}