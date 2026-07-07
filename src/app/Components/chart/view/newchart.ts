
import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
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

  ngOnInit(): void {
    this.JsonState.fetchTaskData = history.state.editData;
    this.JsonState.chartId = this.JsonState.fetchTaskData?.chart_id ?? 0;
    this.JsonState.taskId = this.JsonState.fetchTaskData?.id ?? 0;
    this.jsonPathConverttoView(this.JsonState.fetchTaskData?.json_path);
  }

  jsonPathConverttoView(data: any) {
    this.JsonState.setLoading(true);
    this.chartUseCase.wasabiUsecase(data).subscribe({
      next: (res) => {
        this.jsonPathConvert(res.data.wasabi_url);
        this.JsonState.setLoading(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.JsonState.setLoading(false);
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

  setActiveTool(tool: ToolMode): void {
    this.toolsUsecase.cancelDrawing();
    if (tool !== 'measure') this.measureUsecase.clearMeasure(this.measureCanvas);
    this.JsonState.activeTool = tool;
    if (tool !== 'select') {
      this.JsonState.selectedLineId = null;
      this.clearHandles();
    }
    this.toast.info(`Tool: ${tool}`);
    this.JsonToCandleUsecase.renderLines();
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
  if (
    (event.key === 'Delete' || event.key === 'Backspace') &&
    this.JsonState.activeTool === 'select' &&
    this.JsonState.selectedLineId
  ) {
    event.preventDefault();
    this.deleteSelectedLine();
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
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
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    this.saveAllLines();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
    event.preventDefault();
    this.resetAllLines();
    return;
  }
  if (event.key === '1') this.setActiveTool('select');
  if (event.key === '2') this.setActiveTool('trendline');
  if (event.key === '3') this.setActiveTool('straightline');
  if (event.key === '4') this.setActiveTool('measure');
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
  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.JsonState.isMeasuring) this.measureUsecase.clearMeasure;
    if (this.JsonState.isDrawing) this.toolsUsecase.cancelDrawing();
    this.setActiveTool('select');
    this.JsonState.selectedLineId = null;
    this.clearHandles();
    this.JsonToCandleUsecase.renderLines();
  }

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

async saveAllLines(): Promise<void> {
  const lines = this.JsonState.newDrawLine.filter((l) => !l.is_delete);

  if (!lines.length) {
    this.toast.info('Nothing to save.');
    await this.localDatabaseService.deleteLinesByChartAndTask(
      this.JsonState.chartId,
      this.JsonState.taskId,
    );
    this.location.back();
    return;
  }

  const toCreate = lines.filter((l) => !l.answer_id);
  const toUpdate = lines.filter((l) => l.answer_id && l.is_edit);

  if (!toCreate.length && !toUpdate.length) {
    this.toast.info('Nothing to save.');
    await this.localDatabaseService.deleteLinesByChartAndTask(
      this.JsonState.chartId,
      this.JsonState.taskId,
    );
    this.location.back();
    return;
  }

  this.JsonState.setLoading(true);

  const requests: Observable<any>[] = [];

  // if (toCreate.length) {
  //   requests.push(
  //     this.chartUseCase.createChart({
  //       chart_id: this.JsonState.chartId,
  //       task_id: this.JsonState.taskId,
  //       answer_list: toCreate.map((l) => ({
  //         start_time: l.start_time,
  //         end_time: l.end_time,
  //         start_price: l.start_price,
  //         end_price: l.end_price,
  //         start_x: Number(l.start_x ?? 0),
  //         end_x: Number(l.end_x ?? 0),
  //         start_y: Number(l.start_y ?? 0),
  //         end_y: Number(l.end_y ?? 0),
  //       })),
  //     } as any),
  //   );
  // }

  // if (toUpdate.length) {
  //   requests.push(
  //     this.chartUseCase.editChart({
  //       chart_id: this.JsonState.chartId,
  //       task_id: this.JsonState.taskId,
  //       answer_list: toUpdate.map((l) => ({
  //         id: l.answer_id,
  //         start_time: l.start_time,
  //         end_time: l.end_time,
  //         start_price: l.start_price,
  //         end_price: l.end_price,
  //         start_x: Number(l.start_x ?? 0),
  //         end_x: Number(l.end_x ?? 0),
  //         start_y: Number(l.start_y ?? 0),
  //         end_y: Number(l.end_y ?? 0),
  //       })),
  //     } as any),
  //   );
  // }

  forkJoin(requests.length ? requests : [of(null)]).subscribe({
    next: async () => {
      this.toast.success('All lines saved to server.');
      await this.localDatabaseService.deleteLinesByChartAndTask(
        this.JsonState.chartId,
        this.JsonState.taskId,
      );
      this.JsonState.setLoading(false);
      this.location.back();
    },
    error: (err) => {
      console.error('[Chart] Save failed:', err);
      this.toast.info('Failed to save lines.');
      this.JsonState.setLoading(false);
    },
  });
}

backToDashboard(): void {
  this.saveAllLines();
}

async loadLinesFromServer(): Promise<void> {
  this.JsonState.setLoading(true);

  this.chartUseCase.getChart({
    chart_id: this.JsonState.chartId,
    task_id: this.JsonState.taskId,
  }).subscribe({
    next: async (res) => {
      const serverLines: any[] = res?.data?.answer_list ?? [];
      await this.JsonToCandleUsecase.seedLinesFromServer(serverLines, this.localDatabaseService);
      this.JsonToCandleUsecase.renderLines();
      this.JsonState.setLoading(false);
    },
    error: (err) => {
      console.error('[Chart] getChart failed:', err);
      this.JsonState.setLoading(false);
    },
  });
}






}