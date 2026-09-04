import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpEngine } from '../../../../../services/engine/http_engine';
import {
  CalendarRequest,
  CalendarResponse,
  JournalSummaryResponse,
  WalletChartRequest,
  WalletChartResponse,
} from '../models/wallet-journal.model';

@Injectable({ providedIn: 'root' })
export class JournalService {
  private http = inject(HttpEngine);

  getSummary(userId: number): Observable<JournalSummaryResponse> {
    return this.http.get<JournalSummaryResponse>(`/api/journal/wallet/summary/${userId}`, true);
  }

  getCalendar(data: CalendarRequest): Observable<CalendarResponse> {
    return this.http.post<CalendarResponse>('/api/journal/wallet/calendar', data, true);
  }

  getChart(payload: WalletChartRequest): Observable<WalletChartResponse> {
  return this.http.post<WalletChartResponse>('/api/journal/wallet/chart', payload);
}
}
