import { inject, Injectable } from '@angular/core';
import { JournalRepository } from './wallet-journal.repository';
import { JournalService } from '../services/wallet-journal.service';
import { Observable } from 'rxjs';
import {
  CalendarRequest,
  CalendarResponse,
  JournalSummaryResponse,
  WalletChartRequest,
  WalletChartResponse,
} from '../models/wallet-journal.model';

@Injectable({ providedIn: 'root' })
export class JournalRepositoryImpl implements JournalRepository {
  private service = inject(JournalService);
  journalService: any;

  getSummary(userId: number): Observable<JournalSummaryResponse> {
    return this.service.getSummary(userId);
  }

  getCalendar(data: CalendarRequest): Observable<CalendarResponse> {
    return this.service.getCalendar(data);
  }

  getChart(payload: WalletChartRequest):Observable<WalletChartResponse> {
  return this.service.getChart(payload);   
}

}