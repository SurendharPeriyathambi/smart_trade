import { CommonModule,Location } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from "../header/header";

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
})
export class WalletJournalModal implements OnInit {

constructor(private router: Router, private location: Location,private elRef: ElementRef) {}

 
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  if (!this.showFilter) return;
 
  const filterWrap = this.elRef.nativeElement.querySelector('.filter-wrap');
  if (filterWrap && !filterWrap.contains(event.target as Node)) {
    this.showFilter = false;
  }
}

  ngOnInit(): void {}

  goBack(): void {
    this.location.back();
  }

  chartType: 'line' | 'bar' = 'line';
  chartPeriod: 'year' | 'month' | 'week' = 'month';

selectedYear = 2026;
selectedMonth = 7; 
selectedWeek = 3;

toggleChart(): void {
  this.chartType = this.chartType === 'line' ? 'bar' : 'line';
}

years = [2024, 2025, 2026];

months = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' }
];

weeks = [1, 2, 3, 4, 5];

changeChartPeriod(
  period: 'year' | 'month' | 'week'
): void {

  this.chartPeriod = period;

  // Default values when switching
  if (period === 'month') {
    this.selectedYear = 2026;
  }

  if (period === 'week') {
    this.selectedMonth = 7;
    this.selectedYear = 2026;
  }

  this.onPeriodChange();
}

onPeriodChange(): void {
  // filteredChartData automatically changes
}

  readonly MAX_RANGE_DAYS = 30;

  accountSize = 90000;
  totalProfit = 24500;
  totalLoss = 8200;

  biggestWin = 12400;
  biggestLoss = 3600;
  avgWinRatio = 68.5;

  // ---- Calendar ----
  currentMonth = new Date(2026, 7, 1);
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
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
  }

  goToday(): void {
    const today = new Date();
    this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  private dateFor(day: number): Date {
    return new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
  }

  private daysBetween(a: Date, b: Date): number {
    const ms = Math.abs(b.getTime() - a.getTime());
    return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  // ---- Date range (driven by the Filter panel) ----
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

  // ---- Filter panel (From / To date picker) ----
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

    const span = this.daysBetween(start, end);
    if (span > this.MAX_RANGE_DAYS) {
      this.filterError = `You can select a maximum of ${this.MAX_RANGE_DAYS} days`;
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

  // ---- Chart (sample data - trade balance over time) ----
chartData: ChartPoint[] = [

  // 2025
  { label: 'Jan 05', value: 42000, fullDate: new Date(2025, 0, 5) },
  { label: 'Jan 12', value: 45000, fullDate: new Date(2025, 0, 12) },
  { label: 'Jan 20', value: 43500, fullDate: new Date(2025, 0, 20) },

  { label: 'Mar 04', value: 47000, fullDate: new Date(2025, 2, 4) },
  { label: 'Mar 15', value: 49500, fullDate: new Date(2025, 2, 15) },

  { label: 'Jul 08', value: 51000, fullDate: new Date(2025, 6, 8) },
  { label: 'Jul 18', value: 53500, fullDate: new Date(2025, 6, 18) },

  // 2026
  { label: 'Jan 05', value: 44000, fullDate: new Date(2026, 0, 5) },
  { label: 'Jan 15', value: 48000, fullDate: new Date(2026, 0, 15) },

  { label: 'Jun 05', value: 52000, fullDate: new Date(2026, 5, 5) },
  { label: 'Jun 15', value: 55000, fullDate: new Date(2026, 5, 15) },

  { label: 'Jul 21', value: 45000, fullDate: new Date(2026, 6, 21) },
  { label: 'Jul 25', value: 47500, fullDate: new Date(2026, 6, 25) },
  { label: 'Jul 29', value: 43200, fullDate: new Date(2026, 6, 29) },

  { label: 'Aug 03', value: 51000, fullDate: new Date(2026, 7, 3) },
  { label: 'Aug 07', value: 49800, fullDate: new Date(2026, 7, 7) },
  { label: 'Aug 11', value: 58200, fullDate: new Date(2026, 7, 11) },
  { label: 'Aug 15', value: 61000, fullDate: new Date(2026, 7, 15) },
  { label: 'Aug 18', value: 65400, fullDate: new Date(2026, 7, 18) },
];
  // get filteredChartData(): ChartPoint[] {
  //   if (!this.rangeStart || !this.rangeEnd) {
  //     return this.chartData;
  //   }
  //   const start = this.rangeStart;
  //   const end = this.rangeEnd;
  //   const filtered = this.chartData.filter(d => d.fullDate >= start && d.fullDate <= end);
  //   return filtered.length > 0 ? filtered : this.chartData;
  // }

 get filteredChartData(): ChartPoint[] {

  // YEAR
  // No selection required
  if (this.chartPeriod === 'year') {

    return this.years.map(year => {

      const data = this.chartData.filter(item =>
        item.fullDate.getFullYear() === year
      );

      return {
        label: year.toString(),
        value: data.length
          ? data[data.length - 1].value
          : 0,
        fullDate: new Date(year, 11, 31)
      };

    });
  }


  // MONTH
  // Selected YEAR → 12 months
  if (this.chartPeriod === 'month') {

    return this.months.map((month, index) => {

      const data = this.chartData.filter(item =>
        item.fullDate.getFullYear() === this.selectedYear &&
        item.fullDate.getMonth() === index
      );

      return {
        label: month.label.substring(0, 3),
        value: data.length
          ? data[data.length - 1].value
          : 0,
        fullDate: new Date(this.selectedYear, index, 1)
      };

    });
  }


  // WEEK
  // Selected MONTH + YEAR → 4 weeks
  return [1, 2, 3, 4].map(week => {

    const startDay = ((week - 1) * 7) + 1;
    const endDay = week * 7;

    const data = this.chartData.filter(item => {

      const date = item.fullDate;

      return (
        date.getFullYear() === this.selectedYear &&
        date.getMonth() === this.selectedMonth &&
        date.getDate() >= startDay &&
        date.getDate() <= endDay
      );

    });

    return {
      label: `Week ${week}`,
      value: data.length
        ? data[data.length - 1].value
        : 0,
      fullDate: new Date(
        this.selectedYear,
        this.selectedMonth,
        startDay
      )
    };

  });
}

  chartWidth = 420;
  chartHeight = 240;
  padding = { top: 20, right: 20, bottom: 32, left: 60 };

  get maxValue(): number {
    return Math.max(...this.filteredChartData.map(d => d.value)) * 1.1;
  }
  get minValue(): number {
    return Math.min(...this.filteredChartData.map(d => d.value)) * 0.9;
  }
  get plotWidth(): number {
    return this.chartWidth - this.padding.left - this.padding.right;
  }
  get plotHeight(): number {
    return this.chartHeight - this.padding.top - this.padding.bottom;
  }

  xPos(i: number): number {
    const total = this.filteredChartData.length;
    const step = total > 1 ? this.plotWidth / (total - 1) : 0;
    return this.padding.left + step * i;
  }

  yPos(value: number): number {
    const range = this.maxValue - this.minValue;
    const ratio = range > 0 ? (value - this.minValue) / range : 0.5;
    return this.padding.top + this.plotHeight - ratio * this.plotHeight;
  }

  get linePoints(): string {
    return this.filteredChartData.map((d, i) => `${this.xPos(i)},${this.yPos(d.value)}`).join(' ');
  }

  get yAxisTicks(): number[] {
    const steps = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= steps; i++) {
      ticks.push(Math.round(this.minValue + ((this.maxValue - this.minValue) / steps) * i));
    }
    return ticks.reverse();
  }

  getPnL(day: number | null): number | null {
    if (!day) return null;
    const d = this.dateFor(day);

    const idx = this.chartData.findIndex(p => this.sameDay(p.fullDate, d));
    if (idx === -1) return null;
    if (idx === 0) return null;

    return this.chartData[idx].value - this.chartData[idx - 1].value;
  }

  barWidth = 14;

barX(i: number): number {
  return this.xPos(i) - this.barWidth / 2;
}

barY(value: number): number {
  return this.yPos(value);
}

barHeight(value: number): number {
  const bottom = this.padding.top + this.plotHeight;

  return bottom - this.yPos(value);
}

getTradeCount(day: number | null): number {
  if (!day) return 0;

  const d = this.dateFor(day);

  const tradeCounts: Record<string, number> = {
    '2026-08-03': 1,
    '2026-08-07': 1,
    '2026-08-11': 4,
    '2026-08-15': 2,
    '2026-08-18': 2
  };

  const key =
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return tradeCounts[key] ?? 0;
}
}