import { ElementRef, Injectable, signal, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DrawingLine, ThemeMode } from '../model/drawing.model';
import { Point } from 'lightweight-charts';
import { Answers } from '../model/chart.model';
type ToolMode = 'trendline' | 'hline' | 'vline' | 'ray' | 'straightline' | 'select' | 'measure';

@Injectable({ providedIn: 'root' })
export class ChartState {
  candleSeries:any;
  //=================== variable for chart make ======================
  public savedTimeRange: { from: number; to: number } | null = null; // <-- ADD THIS
  public zoomMinPrice: number | null = null;
  public zoomMaxPrice: number | null = null;
  public isZoomed: boolean = false;
  testId: number = 0;
  chartId!: number;
  taskId!: number;
  public chartReady = false;
  public pendingJsonChartData: any = null;
  fetchTaskData: any; // data passed via router `history.state.editData`
  public rawChartData: any[] = []; // un-resampled, source-of-truth candle array
  public chartData: any[] = []; // resampled candle array currently shown on the chart
  public candlestickSeries: any = null; // lightweight-charts candlestick series instance
  public lineSeriesMap: Map<string, any> = new Map(); // reserved for drawn-line series (not used yet in this component)
  public chart: any = null; // lightweight-charts chart instance
  currentTheme: ThemeMode = 'dark';
  public _blockContextMenu!: (e: Event) => void; // native right-click blocker (assigned in ngAfterViewInit)

  selectedLineId: string | null | any = null; // reserved for future line-selection support

  public chartClickSubscription: (() => void) | null = null;
  public chartCrosshairSubscription: (() => void) | null = null; // NOTE: never actually assigned (see initChart) — crosshair handling isn't wired up yet in this component
  activeTimeframe: string = '15m';
  public themes = {
    light: {
      background: '#ffffff',
      textColor: '#333333',
      gridColor: '#e0e0e0',
      borderColor: '#d1d1d1',
    },
    dark: {
      background: '#1e222d',
      textColor: '#d1d4dc',
      gridColor: '#2a2e39',
      borderColor: '#2a2e39',
    },
  };
  public clickTimeout: any = null; // debounce timer used to distinguish single vs double click
  public isDoubleClick: boolean = false;
  //================= set active tools =====================
  isDrawing: boolean = false;
  public hasFirstPoint: boolean = false; // true once the first click of a draw has registered
  drawingStartPoint: Point | null | any= null; // first click's chart-space point for the in-progress draw
  activeTool: ToolMode = 'select';
  previewSeries: any = null; // temporary lightweight-charts series shown while drawing
  //=========================== measurement tools ===============================
  public handleCanvasContext: CanvasRenderingContext2D | null = null;
  measureStart: Point | null | any = null;
  measureEnd: Point | null | any = null;
  isMeasuring: boolean = false;
  measureCtx: CanvasRenderingContext2D | null | any = null;
  public readonly MAX_UNDO = 20;
  public undoStack: Array<{ newDrawLine: Answers[] }> = [];
  newDrawLine: Answers[] = []; // buffer of freshly drawn straight-line answers (not persisted to server)
  shiftHeld: boolean = false;
  public updatingPreview: boolean = false; // re-entrancy guard for updatePreviewLine

  // ---- DRAG ----
  isDraggingLine = false;
  draggedLineId: string | null = null;
  dragStartPoint: { time: number; price: number } | null = null;
  dragLineSnapshot: Answers | null = null;
  dragDistance = 0;
  isDragClone = false;

  // ---- EXTEND (handle drag) ----
  isExtendingLeftHandle = false;
  isExtendingRightHandle = false;
  extendingLineIdHandle: string | null = null;
  originalLineState: Answers | null = null;

  // ---- helper ----
  findLine(id: string): Answers | undefined {
  return this.newDrawLine.find(l => String(l.id) === id);
}
  loading = signal(false);

  setLoading(status: boolean) {
    console.log(this.loading.set(status));
    return this.loading.set(status);
  }
}
