import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { ChartUseCase } from '../usecase/chart.usecase';
import { JsonToCandleUsecase } from '../usecase/jsonTocandle.usecase';
import { ToolsUsecase } from '../usecase/tools.usecase';
import { MeasureUsecase } from '../usecase/measurement.usecase';
import { DrawingUsecase } from '../usecase/drawline.usecase';
import { SelectionUsecase } from '../usecase/select.usecase';
import { DragUsecase } from '../usecase/drag.usecase';
import { ExtendUsecase } from '../usecase/extend.usecase';
import { DuplicateUsecase } from '../usecase/duplicate.usecase';
import { ChartService } from '../service/chart.service';
import { ChartState } from '../state/chart.state';
import { ChartRepository } from '../repositories/chart.repository';
import { ChartRepositoryImpl } from '../repositories/chart.repository.impl';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../services/engine/toast.service';
import { HttpClient } from '@angular/common/http';
import { LocalDatabaseService } from '../../../../services/engine/localdatabase.service';
import { LoaderService } from '../../../../services/engine/loader.service';

type ToolMode = 'trendline' | 'hline' | 'vline' | 'ray' | 'straightline' | 'select' | 'measure';

@Component({
  selector: 'app-new-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newchart.html',
  styleUrl: './newchart.scss',
  providers: [
    ChartUseCase,
    JsonToCandleUsecase,
    ToolsUsecase,
    MeasureUsecase,
    DrawingUsecase,
    SelectionUsecase,
    DragUsecase,
    ExtendUsecase,
    DuplicateUsecase,
    ChartService,
    ChartState,
    {
      provide: ChartRepository,
      useClass: ChartRepositoryImpl,
    },
  ],
})
export class NewChart implements OnInit, OnDestroy {
  private loader = inject(LoaderService);
  private wheelZoomHandler = (event: WheelEvent) => {
    this.JsonToCandleUsecase.handleWheelZoom(event, this.chartContainer);
  };

  // Capture-phase mousedown handler — stored so we can remove it in ngOnDestroy
  private captureMouseDownHandler = (event: MouseEvent) => {
    if (this.JsonState.activeTool !== 'select') return;

    const container = this.chartContainer?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sp = { x: event.clientX - rect.left, y: event.clientY - rect.top };

     // ── Label click check FIRST — clicking a name box opens the rename input,
    // and must win over line-drag / handle-drag detection below.
    const labelHit = this.JsonToCandleUsecase.getLabelAtPoint(sp);
    if (labelHit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.openLabelEditor(labelHit, sp);
      return;
    }

    const handle = this.selectionUsecase.getHandleAtPoint(sp, (t, p) =>
      this.JsonToCandleUsecase.chartToScreenPoint(t, p),
    );
    const target = handle
      ? true
      : this.selectionUsecase.getTargetLine(sp, (t, p) =>
          this.JsonToCandleUsecase.chartToScreenPoint(t, p),
        );

    if (handle || target) {
      // A line/handle is under the cursor — block the chart's native pan
      // BEFORE lightweight-charts' own listener runs, then run our own drag logic.
      event.preventDefault();
      event.stopImmediatePropagation();

      if (handle) {
        this.extendUsecase.onHandleMouseDown(handle);
      } else {
        this.dragUsecase.onMouseDown(event, this.chartContainer);
      }
    }
  };

  timeframes = [
    { label: '15m', value: '15m' },
    { label: '4H', value: '4H' },
    { label: '1D', value: '1D' },
    { label: '1M', value: '1M' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public JsonState: ChartState,
    public JsonToCandleUsecase: JsonToCandleUsecase,
    public location: Location,
    public toast: ToastService,
    private http: HttpClient,
    private chartUseCase: ChartUseCase,
    private cdr: ChangeDetectorRef,
    public toolsUsecase: ToolsUsecase,
    private measureUsecase: MeasureUsecase,
    public drawingUsecase: DrawingUsecase,
    private selectionUsecase: SelectionUsecase,
    private dragUsecase: DragUsecase,
    private extendUsecase: ExtendUsecase,
    private duplicateUsecase: DuplicateUsecase,
    private localDatabaseService: LocalDatabaseService,
  ) {}

  @ViewChild('chartContainer') chartContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('handleCanvas') handleCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('measureCanvas') measureCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('labelInput') labelInput?: ElementRef<HTMLInputElement>;


  ngOnInit(): void {
    this.JsonState.fetchTaskData = history.state.editData;
    this.JsonState.chartId = this.JsonState.fetchTaskData?.chart_id ?? 0;
    this.JsonState.taskId = this.JsonState.fetchTaskData?.id ?? 0;
    this.jsonPathConverttoView(this.JsonState.fetchTaskData?.json_path);
  }

  jsonPathConverttoView(data: any) {
    this.loader.show();
    this.chartUseCase.wasabiUsecase(data).subscribe({
      next: (res) => {
        this.jsonPathConvert(res.data.wasabi_url);
        this.loader.hide();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loader.hide();
        this.cdr.detectChanges();
      },
    });
  }

  jsonPathConvert(path: any) {
    this.http.get(path).subscribe({
      next: (data: any) => {
        const rawArray = this.JsonToCandleUsecase.objectToCandleArray(data);
        const normalized = this.JsonToCandleUsecase.normalizeChartData(rawArray);
        if (this.JsonState.chartReady) {
          this.applyJsonChartData(normalized);
        } else {
          this.JsonState.pendingJsonChartData = normalized;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Chart] Failed to fetch json:', err);
      },
    });
  }

  private applyJsonChartData(normalized: any[]): void {
    if (!normalized?.length) {
      return;
    }
    this.JsonState.rawChartData = normalized;
    this.JsonState.chartData = this.JsonToCandleUsecase.resampleData(
      this.JsonState.rawChartData,
      this.JsonState.activeTimeframe,
    );
    this.JsonToCandleUsecase.applyChartData();
  }

  setTimeframe(tf: string): void {
    this.JsonState.activeTimeframe = tf;
    this.JsonState.chartData = this.JsonToCandleUsecase.resampleData(
      this.JsonState.rawChartData,
      tf,
    );

    this.JsonState.isZoomed = false;
    this.JsonState.zoomMinPrice = null;
    this.JsonState.zoomMaxPrice = null;

    this.JsonToCandleUsecase.applyChartData();
    this.toast.info(`Timeframe: ${tf}`);
  }

  toggleTheme(): void {
    this.JsonState.currentTheme = this.JsonState.currentTheme === 'dark' ? 'light' : 'dark';
    this.JsonToCandleUsecase.applyTheme(this.chartContainer);
  }

  ngAfterViewInit(): void {
    this.chartContainer.nativeElement.addEventListener('wheel', this.wheelZoomHandler, {
      passive: false,
    });

    // Capture-phase mousedown on the chart container itself — runs BEFORE
    // lightweight-charts' own internal canvas listener, so we can block
    // its native pan gesture whenever a line/handle is under the cursor.
    this.chartContainer.nativeElement.addEventListener(
      'mousedown',
      this.captureMouseDownHandler,
      true, // capture: true
    );

    this.JsonState._blockContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };
    document.addEventListener('contextmenu', this.JsonState._blockContextMenu, true);

    setTimeout(async () => {
      try {
        await this.JsonToCandleUsecase.initChart(this.chartContainer, this.measureCanvas);
        this.JsonState.chartReady = true;
        this.JsonToCandleUsecase.setupHandleCanvas(this.handleCanvas, this.chartContainer);

        if (this.JsonState.pendingJsonChartData) {
          this.applyJsonChartData(this.JsonState.pendingJsonChartData);
          this.JsonState.pendingJsonChartData = null;
        }

        await this.loadLinesFromServer();
      } catch (error) {
        console.error('[Chart] Initialization failed:', error);
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.chartContainer.nativeElement.removeEventListener('wheel', this.wheelZoomHandler);
    this.chartContainer.nativeElement.removeEventListener(
      'mousedown',
      this.captureMouseDownHandler,
      true,
    );
    document.removeEventListener('contextmenu', this.JsonState._blockContextMenu, true);
  }

  // ── REPLACE setActiveTool() ──
  // setActiveTool(tool: ToolMode): void {
  //   // Only trendline drawing + select are enabled — everything else disabled.
  //   if (tool !== 'select' && tool !== 'trendline') {
  //     this.toast.info('Only trend line drawing is enabled.');
  //     return;
  //   }
  //   if (tool === 'trendline' && this.JsonState.remainingLines <= 0) {
  //     this.toast.info(`You've drawn all ${this.JsonState.requiredLineCount} required lines.`);
  //     return;
  //   }
    
  //   this.toolsUsecase.cancelDrawing();
  //   // if (tool !== 'measure') this.measureUsecase.clearMeasure(this.measureCanvas);
  //   this.JsonState.activeTool = tool;
  //   if (tool !== 'select') {
  //     this.JsonState.selectedLineId = null;
  //     this.clearHandles();
  //   }
  //   this.toast.info(`Tool: ${tool}`);
  //   this.JsonToCandleUsecase.renderLines();
  // }
 setActiveTool(tool: ToolMode): void {
    this.toolsUsecase.cancelDrawing();
    // if (tool !== 'measure') this.measureUsecase.clearMeasure(this.measureCanvas);
    this.JsonState.activeTool = tool;
    if (tool !== 'select') {
      this.JsonState.selectedLineId = null;
      this.clearHandles();
    }
    // this.toast.info(`Tool: ${tool}`);
    this.JsonToCandleUsecase.renderLines();
  }

 async submitAnswers(): Promise<void> {
  if (this.JsonState.pendingSaves > 0) {
    this.toast.info('Still saving your last edit — try again in a moment.');
    return;
  }

  this.loader.show();
  try {
    this.JsonState.hasSubmitted = true;

    const adminLines = await this.localDatabaseService.getByChartAndTask(
      this.JsonState.chartId,
      this.JsonState.taskId,
    );
    const userLines = await this.localDatabaseService.getUserByChartAndTask(
      this.JsonState.chartId,
      this.JsonState.taskId,
    );

    const resultsById = this.JsonToCandleUsecase.validateLinesPixelBased(adminLines, userLines);

    this.JsonState.userLineResults.clear();
    const matchedByTag: Record<string, number> = {};
    let matched = 0;

    for (const line of this.JsonState.newDrawLine.filter((l) => !l.is_delete)) {
      const isCorrect =
        line.localDbId != null ? (resultsById.get(line.localDbId) ?? false) : false;

      this.JsonState.userLineResults.set(String(line.id), isCorrect);

      if (isCorrect) {
        matched++;
        const tag = (line.tag ?? '').trim() || 'Untagged';
        matchedByTag[tag] = (matchedByTag[tag] ?? 0) + 1;
        // this.toast.success('Line correct! ✓');
      } else {
        // this.toast.info('Line incorrect — start or end point does not match.');
      }
    } // ← THIS was the missing brace — closes the for loop

    this.JsonState.matchedCount = matched;
    this.JsonState.matchedCountByTag = matchedByTag;
    this.JsonToCandleUsecase.renderLines();
    this.toast.success(`${matched} / ${this.JsonState.requiredLineCount} correct`);
  } finally {
    this.loader.hide();
  }
}
  // ── NEW: retryDrawing() ──
  async retryDrawing(): Promise<void> {
    // Remove user-drawn lines from IndexedDB + memory
    await this.localDatabaseService.deleteUserLinesByChartAndTask(
      this.JsonState.chartId,
      this.JsonState.taskId,
    );
    this.JsonState.newDrawLine = [];

    // Reset submit/result state (admin lines stay loaded in state,
    // but overlay only renders when hasSubmitted is true, so they'll hide)
    this.JsonState.hasSubmitted = false;
this.JsonState.matchedCount = 0;
this.JsonState.matchedCountByTag = {};
this.JsonState.userLineResults.clear();
this.JsonState.selectedLineId = null;

    this.clearHandles();
    this.JsonState.activeTool = 'trendline';
    this.JsonToCandleUsecase.renderLines();
    this.toast.info('Try again — draw your lines.');
  }
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      this.toolsUsecase.undoLastChange();
      return;
    }
      // new: delete the measurement graphic when measure tool is active
if (event.key === 'Delete' || event.key === 'Backspace') {
  if (this.JsonState.activeTool === 'select' && this.JsonState.selectedLineId) {
    event.preventDefault();
    this.deleteSelectedLine();
    return;
  }
  if (this.JsonState.selectedMeasureIndex !== null) {
    event.preventDefault();
    const removed = this.measureUsecase.deleteSelectedMeasurement(
      this.measureCanvas,
      (t, p) => this.JsonToCandleUsecase.chartToScreenPoint(t, p),
      (f, t) => this.JsonToCandleUsecase.countBarsInRange(f, t),
    );
    this.toast.info(removed ? 'Measurement removed.' : 'Nothing selected.');
    return;
  }}
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.JsonState.editingLabelLineId) {
      this.closeLabelEditor(false);
      return;
    }
      if (this.JsonState.isMeasuring) this.measureUsecase.clearMeasure(this.measureCanvas);
      if (this.JsonState.isDrawing) this.toolsUsecase.cancelDrawing();
      this.setActiveTool('select');
      this.JsonState.selectedLineId = null;
      this.clearHandles();
      this.JsonToCandleUsecase.renderLines();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.duplicateSelectedLine();
      return;
    }
  }

  async deleteSelectedLine(): Promise<void> {
    if (!this.JsonState.selectedLineId) {
      this.toast.info('Select a line first.');
      return;
    }
    const id = this.JsonState.selectedLineId;

    this.toolsUsecase.pushUndo(); // snapshot BEFORE removal, so undo still works

    await this.dragUsecase.deleteLine(id);

    // Fully remove from in-memory array now that local DB row is gone
    this.JsonState.newDrawLine = this.JsonState.newDrawLine.filter((l) => l.id !== id);

    this.JsonState.selectedLineId = null;
    this.clearHandles();
    this.JsonToCandleUsecase.renderLines();
    this.toast.success('Line deleted.');
  }
  // @HostListener('document:contextmenu', ['$event'])
  // onRightClick(event: MouseEvent): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   if (this.JsonState.isMeasuring) this.measureUsecase.clearMeasure;
  //   if (this.JsonState.isDrawing) this.toolsUsecase.cancelDrawing();
  //   this.setActiveTool('select');
  //   this.JsonState.selectedLineId = null;
  //   this.clearHandles();
  //   this.JsonToCandleUsecase.renderLines();
  // }

  private clearHandles(): void {
    this.JsonToCandleUsecase.clearHandlesCanvas(this.handleCanvas);
  }

  // NOTE: onDocMouseDown removed — replaced by captureMouseDownHandler
  // registered directly on chartContainer with capture:true in ngAfterViewInit.
  // This wins the race against lightweight-charts' internal pan listener,
  // which was causing the chart to jitter/shake while dragging a line.

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(event: MouseEvent): void {
    this.dragUsecase.onMouseMove(event, this.chartContainer);
    this.extendUsecase.onMouseMove(event, this.chartContainer);
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    this.dragUsecase.onMouseUp();
    this.extendUsecase.onMouseUp();
  }

  duplicateSelectedLine(): void {
    this.duplicateUsecase.duplicateSelectedLine();
  }
  duplicateAndExtendManually(): void {
    this.duplicateUsecase.duplicateAndExtendManually();
  }
  showExtensionControls(): void {
    this.extendUsecase.showExtensionControls();
  }
  closeExtendControls(): void {
    this.extendUsecase.closeExtendControls();
  }
  extendLineManually(): void {
    this.extendUsecase.extendLineManually();
  }
  resetAllLines(): void {}
   // ==================== LABEL EDIT (click name above line to rename) ====================

  /** Opens the inline rename input positioned over the clicked label's screen coords. */
  openLabelEditor(line: any, sp: { x: number; y: number }): void {
    this.JsonState.editingLabelLineId = String(line.id);
    this.JsonState.editingLabelValue = line.label ?? '';
    this.JsonState.editingLabelScreenX = sp.x;
    this.JsonState.editingLabelScreenY = sp.y;
    this.JsonToCandleUsecase.renderLines(); // repaint so the canvas label hides while input is open
    setTimeout(() => this.labelInput?.nativeElement?.focus(), 0);
  }

  /** Commits (or discards) the edit and saves the new label to the local DB — never sent to the server. */
  async closeLabelEditor(save: boolean): Promise<void> {
    const id = this.JsonState.editingLabelLineId;
    if (!id) return;

    if (save) {
      const line = this.JsonState.findLine(id);
      if (line) {
        line.tag = this.JsonState.editingLabelValue.trim();
        if (line.localDbId) {
          await this.localDatabaseService.updateAnswer(line.localDbId, {
            ...line,
          } as any);
        }
      }
    }

    this.JsonState.editingLabelLineId = null;
    this.JsonState.editingLabelValue = '';
    this.JsonToCandleUsecase.renderLines();
  }

  onLabelInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.closeLabelEditor(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeLabelEditor(false);
    }
  }


  async backToDashboard() {
    this.retryDrawing().then(() => {
      this.location.back();
    });
  }

  async loadLinesFromServer(): Promise<void> {
    this.loader.show();

    this.chartUseCase
      .getChart({
        chart_id: this.JsonState.chartId,
        task_id: this.JsonState.taskId,
      })
      .subscribe({
        next: async (res) => {
          const serverLines: any[] = res?.data?.answer_list ?? [];
          await this.JsonToCandleUsecase.seedLinesFromServer(
            serverLines,
            this.localDatabaseService,
          );
          this.JsonToCandleUsecase.renderLines();
          this.loader.hide();
        },
        error: (err) => {
          console.error('[Chart] getChart failed:', err);
          this.loader.hide();
        },
      });
  }
}
