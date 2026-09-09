import { inject, Injectable } from '@angular/core';
import { JournalRepository } from '../repository/wallet-journal.repository';
import { Observable } from 'rxjs';
import {
  CalendarRequest,
  CalendarResponse,
  JournalSummaryData,
  JournalSummaryResponse,
  WalletChartRequest,
} from '../models/wallet-journal.model';

@Injectable({ providedIn: 'root' })
export class JournalUseCase {
  private repo = inject(JournalRepository);

  getSummary(userId: number): Observable<JournalSummaryResponse> {
    return this.repo.getSummary(userId);
  }

  getCalendar(data: CalendarRequest): Observable<CalendarResponse> {
    return this.repo.getCalendar(data);
  }
  getChart(payload: WalletChartRequest) {
    return this.repo.getChart(payload);
  }
}
