import { Observable } from "rxjs";
import { Apiresponse } from "../../chartList/model/chartlist.model";
import { getChartAnswer } from "../model/drawing.model";

export abstract class ChartRepository{
    abstract getChart(payload:getChartAnswer):Observable<Apiresponse<any>>;
    abstract getWasabiFile(path: string): Observable<any>;
}