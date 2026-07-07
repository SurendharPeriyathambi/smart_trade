import { Observable } from "rxjs";
import { CreateChart, getChartAnswer } from "../model/test.model";

import { EditChart } from "../model/chart.model";
import { Apiresponse } from "../../chartList/model/chartlist.model";

export abstract class ChartRepository{
    // abstract createChart(payload:CreateChart):Observable<Apiresponse<any>>;
    abstract getChart(payload:getChartAnswer):Observable<Apiresponse<any>>;
    // abstract editchart(payload:EditChart):Observable<Apiresponse<any>>;
    abstract getWasabiFile(path: string): Observable<Apiresponse<any>>;
}