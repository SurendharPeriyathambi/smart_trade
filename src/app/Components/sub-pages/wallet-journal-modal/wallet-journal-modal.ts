import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../header/header';
import { JournalUseCase } from './usecase/wallet-journal.usecase';
import { JournalService } from './services/wallet-journal.service';
import { JournalRepository } from './repository/wallet-journal.repository';
import { JournalRepositoryImpl } from './repository/wallet-journal.repository.impl';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { ToastService } from '../../../../services/engine/toast.service';
import { CalendarEntry , WalletChartRequest, WalletChartResponse } from './models/wallet-journal.model';
import { LoaderService } from '../../../../services/engine/loader.service';

interface ChartPoint {
  label: string;
  value: number;
  fullDate: Date;
}

@Component({
  selector: 'app-wallet-journal-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './view/wallet-journal-modal.html',
  styleUrl: './view/wallet-journal-modal.scss',
  providers: [
    JournalUseCase,
    JournalService,
    { provide: JournalRepository, useClass: JournalRepositoryImpl },
  ],
})
export class WalletJournalModal implements OnInit {
  private usecase = inject(JournalUseCase);
  private storage = inject(StorageEngine);
  private toast = inject(ToastService);
  private loader = inject(LoaderService);
  private cd = inject(ChangeDetectorRef);


  constructor(
    private router: Router,
    private location: Location,
    private elRef: ElementRef,
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showFilter) return;
    const filterWrap = this.elRef.nativeElement.querySelector('.filter-wrap');
    if (filterWrap && !filterWrap.contains(event.target as Node)) {
      this.showFilter = false;
    }
  }

  // API data
  accountSize = 0;
  totalProfit = 0;
  totalLoss = 0;
  biggestWin = 0;
  biggestLoss = 0;
  avgWinRatio = 0;
  walletId = 0;

  calendarEntries: CalendarEntry[] = [];

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    const userId = this.storage.getId();

    this.loader.show();

    this.usecase.getSummary(Number(userId)).pipe(

    )
    .subscribe({
      next: (res) => {
        if (res.status) {
          this.cd.detectChanges();
          const { balance, calender_month, selected_year, selected_month, years, months } =
            res.data;
          this.walletId = Number(this.storage.getId());

          //  Balance bind
          this.accountSize = parseFloat(balance.wallet);
          this.totalProfit = parseFloat(balance.total_profits);
          this.totalLoss = parseFloat(balance.total_loss);

          // Calendar data
          this.calendarEntries = calender_month;

             

          // Year/Month from API
          this.selectedYear = selected_year;
          this.selectedMonth = selected_month - 1;
          this.apiMonths   = months;
          this.years = years;

          // Calendar navigate to current month
          this.currentMonth = new Date(selected_year, selected_month - 1, 1);

          this.loadCalendar(
            String(res.data.selected_month).padStart(2, '0'),
            String(res.data.selected_year),
          );
          this.loadChart(); 
        } else {
          this.toast.error(res.message);
        }
        this.loader.hide();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Something went wrong');
        this.loader.hide();
      },
    });
  }

  loadCalendar(month: string, year: string): void {
    this.loader.show();
    this.usecase
      .getCalendar({
        wallet_id: this.walletId,
        month: month,
        year: year,
      })
      .subscribe({
        next: (res) => {
          if (res.status) {
            this.cd.detectChanges();
            this.calendarEntries = res.data.calender_month;
            this.loader.hide();
          }
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Calendar load failed');
          this.loader.hide();
        },
      });
  }

  goBack(): void {
    this.location.back();
  }

  getPnL(day: number | null): number | null {
    if (!day) return null;
    const d = this.dateFor(day);
    const key = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    const entry = this.calendarEntries.find((e) => e.date === key);
    if (!entry) return null;
    return entry.direction === 'Inward' ? parseFloat(entry.amount) : parseFloat(entry.amount);
  }
  getTradeCount(day: number | null): number {
    if (!day) return 0;
    const d = this.dateFor(day);
    const key = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    const entry = this.calendarEntries.find((e) => e.date === key);
    return entry ? parseInt(entry.trade_count) : 0;
  }

  // ---- Chart ----
  chartType: 'line' | 'bar' = 'line';
  chartPeriod: 'year' | 'month' | 'week' = 'month';

  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth();

  toggleChart(): void {
    this.chartType = this.chartType === 'line' ? 'bar' : 'line';
  }

  years: number[] = [];
  apiMonths: number[] = []; 

  get availableMonths() {
  return this.months.filter(m => 
    this.apiMonths.includes(m.value) 
  );
}

  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
    summarymonths = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

changeChartPeriod(period: 'year' | 'month' | 'week'): void {
  this.chartPeriod = period;
  this.loadChart();     
}

onPeriodChange(): void {
  this.loadChart();     
}
  // ---- Calendar ----
  currentMonth = new Date();
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  get calendarDays(): (number | null)[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  }

  get monthLabel(): string {
    return this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1,
    );
    this.loadCalendar(
      String(this.currentMonth.getMonth() + 1).padStart(2, '0'),
      String(this.currentMonth.getFullYear()),
    );
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1,
    );
    this.loadCalendar(
      String(this.currentMonth.getMonth() + 1).padStart(2, '0'),
      String(this.currentMonth.getFullYear()),
    );
  }

  goToday(): void {
    const today = new Date();
    this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  private dateFor(day: number): Date {
    return new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
  }

  private daysBetween(a: Date, b: Date): number {
    return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  readonly MAX_RANGE_DAYS = 30;
  rangeStart: Date | null = null;
  rangeEnd: Date | null = null;

  isInRange(day: number | null): boolean {
    if (!day || !this.rangeStart || !this.rangeEnd) return false;
    const d = this.dateFor(day);
    return d >= this.rangeStart && d <= this.rangeEnd;
  }

  get isRangeActive(): boolean {
    return !!(this.rangeStart && this.rangeEnd);
  }

  clearRange(): void {
    this.rangeStart = null;
    this.rangeEnd = null;
    this.filterFrom = '';
    this.filterTo = '';
    this.filterError = '';
  }

  showFilter = false;
  filterFrom = '';
  filterTo = '';
  filterError = '';

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  applyFilter(): void {
    this.filterError = '';
    if (!this.filterFrom || !this.filterTo) {
      this.filterError = 'Please pick both a from and to date';
      return;
    }
    const from = new Date(this.filterFrom);
    const to = new Date(this.filterTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      this.filterError = 'Please pick valid dates';
      return;
    }
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    if (this.daysBetween(start, end) > this.MAX_RANGE_DAYS) {
      this.filterError = `Max ${this.MAX_RANGE_DAYS} days`;
      return;
    }
    this.rangeStart = start;
    this.rangeEnd = end;
    this.showFilter = false;
  }

  clearFilter(): void {
    this.filterFrom = '';
    this.filterTo = '';
    this.filterError = '';
    this.rangeStart = null;
    this.rangeEnd = null;
  }

  chartData: ChartPoint[] = [];

loadChart(): void {
  const payload: WalletChartRequest = { wallet_id: this.walletId, month: '', year: '' };

  if (this.chartPeriod === 'week') {
    payload.month = String(this.selectedMonth).padStart(2, '0');
    payload.year  = String(this.selectedYear);
  } else if (this.chartPeriod === 'month') {
    payload.month = '';
    payload.year  = String(this.selectedYear);
  } else {
    // year period → both empty, backend returns all years
    payload.month = '';
    payload.year  = '';
  }

  this.loader.show();
  this.usecase.getChart(payload).subscribe({
    next: (res: WalletChartResponse) => {
      if (res.status) {
        this.cd.detectChanges();
        this.chartData = this.mapChartData(res.data);
        this.biggestWin=Number(res.data.total_win);
        this.biggestLoss=Number(res.data.total_loss);
        this.avgWinRatio=Number(res.data.win_percentage);
         this.loader.hide();
      } else {
        this.toast.error(res.message);
         this.loader.hide();
      }
    },
    error: (err) => {
      this.toast.error(err?.error?.message || 'Chart data load failed');
      this.loader.hide();
    },
  });
}

private mapChartData(data: WalletChartResponse['data']): ChartPoint[] {
  if (data.view === 'weekly' && data.calender_month) {
    return data.calender_month.map((item) => ({
      label: `Week ${item.week}`,
      value: parseFloat(item.amount),
      fullDate: new Date(this.selectedYear, this.selectedMonth, (item.week - 1) * 7 + 1),
    }));
  }

  if (data.view === 'monthly' && data.calender_year) {
    return data.calender_year.map((item) => ({
      label: item.month_name.substring(0, 3),
      value: parseFloat(item.amount),
      fullDate: new Date(this.selectedYear, item.month - 1, 1),
    }));
  }

  if (data.view === 'yearly' && data.calender_years) {
    return data.calender_years.map((item) => ({
      label: item.year.toString(),
      value: parseFloat(item.amount),
      fullDate: new Date(item.year, 11, 31),
    }));
  }

  return [];
}


  chartWidth = 420;
  chartHeight = 240;
  padding = { top: 20, right: 20, bottom: 32, left: 60 };

  get maxValue(): number {
    return Math.max(...this.chartData.map((d) => d.value), 1) * 1.1;
  }
  get minValue(): number {
    return Math.min(...this.chartData.map((d) => d.value), 0) * 0.9;
  }
  get plotWidth(): number {
    return this.chartWidth - this.padding.left - this.padding.right;
  }
  get plotHeight(): number {
    return this.chartHeight - this.padding.top - this.padding.bottom;
  }

  xPos(i: number): number {
    const total = this.chartData.length;
    const step = total > 1 ? this.plotWidth / (total - 1) : 0;
    return this.padding.left + step * i;
  }

  yPos(value: number): number {
    const range = this.maxValue - this.minValue;
    const ratio = range > 0 ? (value - this.minValue) / range : 0.5;
    return this.padding.top + this.plotHeight - ratio * this.plotHeight;
  }

  get linePoints(): string {
    return this.chartData.map((d, i) => `${this.xPos(i)},${this.yPos(d.value)}`).join(' ');
  }

  get yAxisTicks(): number[] {
    const steps = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= steps; i++) {
      ticks.push(Math.round(this.minValue + ((this.maxValue - this.minValue) / steps) * i));
    }
    return ticks.reverse();
  }

  barWidth = 14;
  barX(i: number): number {
    return this.xPos(i) - this.barWidth / 2;
  }
  barY(value: number): number {
    return this.yPos(value);
  }
  barHeight(value: number): number {
    return this.padding.top + this.plotHeight - this.yPos(value);
  }
}
