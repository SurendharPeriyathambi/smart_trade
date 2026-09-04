import { Observable } from "rxjs";
import { CalendarRequest, CalendarResponse, JournalSummaryResponse, WalletChartRequest, WalletChartResponse } from "../models/wallet-journal.model";

export abstract class JournalRepository{
    abstract getSummary(userId:number):Observable<JournalSummaryResponse>;
    abstract getCalendar(data: CalendarRequest): Observable<CalendarResponse>;
    abstract getChart(payload: WalletChartRequest): Observable<WalletChartResponse>;
}