// drawing.model.ts

export type ThemeMode = 'dark' | 'light';

export interface Point {
  x: number;
  y: number;
  time: number;
  price: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface getChartAnswer {
  chart_id: number;
  task_id: number;
}