import { Injectable, signal } from '@angular/core';
import { Point, ThemeMode } from '../model/drawing.model';

import { Answers } from '../model/chart.model';

type ToolMode = 'trendline' | 'hline' | 'vline' | 'ray' | 'straightline' | 'select' | 'measure';

@Injectable({ providedIn: 'root' })
export class ChartState {
  /** Per-tag totals, computed from adminLines on seed. e.g. { CHO: 3, STR: 2 } */
public requiredCountByTag: Record<string, number> = {};
/** Per-tag matched counts, computed on submit. e.g. { CHO: 2, STR: 1 } */
public matchedCountByTag: Record<string, number> = {};
  candleSeries: any;
  //=================== variable for chart make ======================
  public savedTimeRange: { from: number; to: number } | null = null;
  public zoomMinPrice: number | null = null;
  public zoomMaxPrice: number | null = null;
  public isZoomed: boolean = false;
  testId: number = 0;
  chartId!: number;
  taskId!: number;
  public chartReady = false;
  public pendingJsonChartData: any = null;
  fetchTaskData: any;
  public rawChartData: any[] = [];
  public chartData: any[] = [];
  public candlestickSeries: any = null;
  public lineSeriesMap: Map<string, any> = new Map();
  public chart: any = null;
  currentTheme: ThemeMode = 'dark';
  public _blockContextMenu!: (e: Event) => void;

  selectedLineId: string | null | any = null;

  public chartClickSubscription: (() => void) | null = null;
  public chartCrosshairSubscription: (() => void) | null = null;
  activeTimeframe: string = '4H';
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
  public clickTimeout: any = null;
  public isDoubleClick: boolean = false;
  //================= set active tools =====================
  isDrawing: boolean = false;
  public hasFirstPoint: boolean = false;
  drawingStartPoint: Point | null | any = null;
  activeTool: ToolMode = 'select';
  previewSeries: any = null;
  //=========================== measurement tools ===============================
  public handleCanvasContext: CanvasRenderingContext2D | null = null;
  measureStart: Point | null | any = null;
  measureEnd: Point | null | any = null;
  isMeasuring: boolean = false;
  measureCtx: CanvasRenderingContext2D | null | any = null;
  measurements: Array<{ start: Point; end: Point }> = [];
selectedMeasureIndex: number | null = null;
  public readonly MAX_UNDO = 20;
  public undoStack: Array<{ newDrawLine: Answers[] }> = [];
  newDrawLine: Answers[] = [];
  shiftHeld: boolean = false;
  public updatingPreview: boolean = false;

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

  
  // ---- LABEL (name above line, click-to-edit) ----
  editingLabelLineId: string | null = null;   // which line's label input is currently open
  editingLabelValue: string = '';             // two-way bound to the inline <input>
  editingLabelScreenX: number = 0;            // px position for the floating input, set on open
  editingLabelScreenY: number = 0;

  // ---- ADMIN / SUBMIT / VALIDATION ----
  /** Admin (correct-answer) lines — kept OUT of newDrawLine so they never render
   *  or persist to userChart before submit. Populated from seedLinesFromServer. */
  public adminLines: Answers[] = [];
  /** How many lines the user is required/allowed to draw — equals adminLines.length. */
  public requiredLineCount: number = 0;
  /** True once the user has clicked Submit — controls admin overlay + result colors. */
  public hasSubmitted: boolean = false;
  /** Count of user lines that matched an admin line on last submit. */
  public matchedCount: number = 0;
  /** lineId (uuid, as string) -> matched boolean, populated on submit. */
userLineResults: Map<string, boolean> = new Map();
  /** Incremented/decremented around any async IndexedDB save (drag/extend/draw).
   *  Submit checks this so it never reads stale data mid-write. */
  public pendingSaves: number = 0;

  /** Tolerance for matching user lines to admin lines (small differences allowed). */
  public readonly TIME_TOLERANCE = 86400 * 2; // 2 days in seconds
  public readonly PRICE_TOLERANCE_PCT = 0.015; // 1.5% of price

  /** Number of trendlines still allowed to be drawn. */
  get remainingLines(): number {
    const drawn = this.newDrawLine.filter((l) => !l.is_delete).length;
    return Math.max(0, this.requiredLineCount - drawn);
  }

  // ---- helper ----
  findLine(id: string): Answers | undefined {
    return this.newDrawLine.find((l) => String(l.id) === id);
  }
  loading = signal(false);

  setLoading(status: boolean) {
    return this.loading.set(status);
  }
get drawnCountByTag(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const line of this.newDrawLine) {
    if (line.is_delete) continue;
    const tag = (line.tag ?? '').trim() || 'Untagged';
    counts[tag] = (counts[tag] ?? 0) + 1;
  }
  return counts;
}

/** True only when every required tag has exactly the right number of drawn lines
 *  (blocks submit if e.g. all 4 lines are tagged CHO but STR needs 2). */
get allTagsComplete(): boolean {
  const required = this.requiredCountByTag;
  const drawn = this.drawnCountByTag;
  return Object.keys(required).every((tag) => (drawn[tag] ?? 0) === required[tag]);
}
}