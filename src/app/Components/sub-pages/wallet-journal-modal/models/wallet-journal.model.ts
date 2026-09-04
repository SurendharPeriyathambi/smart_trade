export interface CalendarEntry {
  date: string;
  trade_count: string;
  amount: string;
  win_loss: 'WIN' | 'LOSS';
  direction: 'Inward' | 'Outward';
}

export interface WalletBalance {
  wallet: string;
  total_profits: string;
  total_loss: string;
}

export interface JournalSummaryData {
  balance: WalletBalance;
  selected_year: number;
  selected_month: number;
  years: number[];
  months: number[];
  calender_month: CalendarEntry[];
}

export interface JournalSummaryResponse {
  status: boolean;
  message: string;
  data: JournalSummaryData;
}

export interface CalendarRequest {
  wallet_id: number;
  month: string;
  year: string;
}

export interface CalendarResponse {
  status: boolean;
  message: string;
  data: {
    selected_year: string;
    selected_month: string;
    calender_month: CalendarEntry[];
  };
}

export interface WalletChartRequest {
  wallet_id: number;
  month: string;
  year: string;
}

export interface WeeklyChartItem {
  week: number;
  amount: string;
  trade_count: number;
  result: string;
}

export interface MonthlyChartItem {
  month: number;
  month_name: string;
  amount: string;
  trade_count: number;
  result: string;
}

export interface YearlyChartItem {
  year: number;
  amount: string;
  trade_count: number;
  result: string;
}

export interface WalletChartResponse {
  status: boolean;
  message: string;
  data: {
    total_win: string;
    total_loss: string;
    win_percentage: string;
    selected_year?: string;
    selected_month?: string;
    view: 'weekly' | 'monthly' | 'yearly';
    calender_month?: WeeklyChartItem[];
    calender_year?: MonthlyChartItem[];
    calender_years?: YearlyChartItem[];
  };
}