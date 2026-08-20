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
    { label: 'Jul 21', value: 45000, fullDate: new Date(2026, 6, 21) },
    { label: 'Jul 25', value: 47500, fullDate: new Date(2026, 6, 25) },
    { label: 'Jul 29', value: 43200, fullDate: new Date(2026, 6, 29) },
    { label: 'Aug 03', value: 51000, fullDate: new Date(2026, 7, 3) },
    { label: 'Aug 07', value: 49800, fullDate: new Date(2026, 7, 7) },
    { label: 'Aug 11', value: 58200, fullDate: new Date(2026, 7, 11) },
    { label: 'Aug 15', value: 61000, fullDate: new Date(2026, 7, 15) },
    { label: 'Aug 18', value: 65400, fullDate: new Date(2026, 7, 18) },
  ];

  get filteredChartData(): ChartPoint[] {
    if (!this.rangeStart || !this.rangeEnd) {
      return this.chartData;
    }
    const start = this.rangeStart;
    const end = this.rangeEnd;
    const filtered = this.chartData.filter(d => d.fullDate >= start && d.fullDate <= end);
    return filtered.length > 0 ? filtered : this.chartData;
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
}