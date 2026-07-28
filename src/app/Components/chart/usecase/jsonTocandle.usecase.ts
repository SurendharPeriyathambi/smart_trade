import { Injectable, Injector } from '@angular/core';
import { CandlestickSeries, createChart, LineSeries, LineStyle } from 'lightweight-charts';
import { Point, ScreenPoint } from '../model/drawing.model';
import { ChartState } from '../state/chart.state';
import { ToolsUsecase } from './tools.usecase';
import { MeasureUsecase } from './measurement.usecase';
import { DrawingUsecase, uuidv4 } from './drawline.usecase';
import { Answers } from '../model/chart.model';
import { SelectionUsecase } from './select.usecase';
import { DuplicateUsecase } from './duplicate.usecase';
import { LocalDatabaseService } from '../../../../services/engine/localdatabase.service';

@Injectable({ providedIn: 'root' })
export class JsonToCandleUsecase {
  constructor(
    public chartstate: ChartState,
    public ToolsUsecase: ToolsUsecase,
    public measureUsecase: MeasureUsecase,
    private injector: Injector,
  ) {}

  public adminLineSeriesMap: Map<string, any> = new Map();

  public objectToCandleArray(obj: any): any[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj).map((dateKey) => ({
      date: dateKey,
      ...obj[dateKey],
    }));
  }

  public normalizeChartData(data: any[]): any[] {
    if (!data?.length) return [];
    const sample = data[0];
    const dateKey =
      Object.keys(sample).find((k) =>
        ['date', 'time', 'datetime', 'timestamp', 'day'].includes(k.toLowerCase().trim()),
      ) ?? Object.keys(sample)[0];
    const findKey = (...cands: string[]) =>
      Object.keys(sample).find((k) => cands.includes(k.toLowerCase().trim()));
    const openKey = findKey('open', 'o');
    const highKey = findKey('high', 'h');
    const lowKey = findKey('low', 'l');
    const closeKey = findKey('close', 'c', 'price', 'value', 'last');

    const toUnix = (raw: any): number => {
      if (typeof raw === 'number') return raw > 100000 ? raw : Math.floor(raw * 86400);
      if (typeof raw === 'string') {
        const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmy) {
          const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`);
          if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
        }
        const dotted = raw.match(
          /^(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
        );
        if (dotted) {
          const [, y, mo, da, h, mi, s] = dotted;
          const d = new Date(
            Date.UTC(Number(y), Number(mo) - 1, Number(da), Number(h), Number(mi), Number(s ?? 0)),
          );
          if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
        }
        const iso = new Date(raw);
        if (!isNaN(iso.getTime())) return Math.floor(iso.getTime() / 1000);
      }
      return NaN;
    };

    return data
      .map((item) => {
        const close = closeKey ? Number(item[closeKey]) : 0;
        return {
          time: toUnix(item[dateKey]),
          open: openKey ? Number(item[openKey]) : close,
          high: highKey ? Number(item[highKey]) : close,
          low: lowKey ? Number(item[lowKey]) : close,
          close,
        };
      })
      .filter((d) => !isNaN(d.time) && d.time > 0 && !isNaN(d.close) && d.close > 0)
      .sort((a, b) => a.time - b.time)
      .filter((d, i, arr) => i === 0 || d.time !== arr[i - 1].time);
  }

  public resampleData(data: any[], tf: string): any[] {
    if (!data?.length) return data;
    if (tf === '1D') return [...data];

    const tfSeconds: Record<string, number> = {
      '15m': 15 * 60,
      '4H': 4 * 3600,
      '1D': 86400,
      '1M': 30 * 86400,
    };

    const bucketSize = tfSeconds[tf];
    if (!bucketSize) return [...data];

    const buckets = new Map<number, any[]>();
    for (const candle of data) {
      const bucket = Math.floor(candle.time / bucketSize) * bucketSize;
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(candle);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucketTime, candles]) => ({
        time: bucketTime,
        open: candles[0].open,
        high: Math.max(...candles.map((c: any) => c.high)),
        low: Math.min(...candles.map((c: any) => c.low)),
        close: candles[candles.length - 1].close,
      }));
  }

  public applyChartData(): void {
    if (!this.chartstate.candlestickSeries || !this.chartstate.chartData.length) return;
    try {
      this.chartstate.candlestickSeries.setData(this.chartstate.chartData);

      if (!this.chartstate.isZoomed) {
        const barsToShow: Record<string, number> = {
          '15m': 96,
          '4H': 60,
          '1D': 90,
          '1M': 24,
        };
        const bars = barsToShow[this.chartstate.activeTimeframe] ?? 90;
        const data = this.chartstate.chartData;

        if (data.length <= bars) {
          this.chartstate.chart.timeScale().fitContent();
        } else {
          const lastBar = data[data.length - 1].time;
          const firstBar = data[data.length - bars].time;
          const padding = (lastBar - firstBar) * 0.05;
          this.chartstate.chart.timeScale().setVisibleRange({
            from: firstBar - padding,
            to: lastBar + padding,
          });
        }
      }

      this.renderLines();
      if (this.chartstate.isZoomed) this.restoreZoom();
    } catch (e) {
      console.error('[Chart] applyChartData error:', e);
    }
  }

  private restoreZoom(): void {
    if (!this.ensureChart()) return;
    if (
      this.chartstate.isZoomed &&
      this.chartstate.zoomMinPrice != null &&
      this.chartstate.zoomMaxPrice != null
    ) {
      this.chartstate.chart.priceScale('right').applyOptions({ autoScale: false });
      this.chartstate.chart.priceScale('right').setVisiblePriceRange({
        minValue: this.chartstate.zoomMinPrice,
        maxValue: this.chartstate.zoomMaxPrice,
      });
    }
  }

  public ensureChart(): boolean {
    if (!this.chartstate.chart || !this.chartstate.candlestickSeries) {
      console.warn('[Chart] Chart not initialized');
      return false;
    }
    return true;
  }

  public renderLines(): void {
    this.renderLinesWithoutScaleReset();
  }

  public applyTheme(chartContainer: any): void {
    if (!this.ensureChart()) return;
    const t = this.chartstate.themes[this.chartstate.currentTheme];

    this.chartstate.chart.applyOptions({
      localization: {
        priceFormatter: (price: number) => this.formatPrice(price, chartContainer),
      },
      layout: { background: { color: t.background }, textColor: t.textColor },
      grid: {
        vertLines: { color: t.gridColor, style: 0, visible: true },
        horzLines: { color: t.gridColor, style: 0, visible: true },
      },
      timeScale: { borderColor: t.borderColor },
      rightPriceScale: { borderColor: t.borderColor },
    });
    this.renderLines();
    this.restoreZoom();
  }

  public formatPrice(price: number, chartContainer: any): string {
    const num = typeof price === 'string' ? parseFloat(price as any) : price;
    if (isNaN(num)) return '';

    const container = chartContainer?.nativeElement;
    if (container && this.chartstate.candlestickSeries) {
      const h = container.clientHeight;
      const top = this.chartstate.candlestickSeries.coordinateToPrice(0) as number | null;
      const bottom = this.chartstate.candlestickSeries.coordinateToPrice(h) as number | null;
      if (top != null && bottom != null && !isNaN(top) && !isNaN(bottom)) {
        const diff = Math.abs(top - bottom);
        if (diff < 0.00001) return num.toFixed(8);
        if (diff < 0.0001) return num.toFixed(7);
        if (diff < 0.001) return num.toFixed(6);
        if (diff < 0.005) return num.toFixed(5);
        if (diff < 0.05) return num.toFixed(4);
        if (diff < 0.5) return num.toFixed(3);
        if (diff < 5) return num.toFixed(2);
        if (diff < 50) return num.toFixed(1);
        return num.toFixed(0);
      }
    }
    return num.toFixed(this.detectPriceDecimals());
  }

  private detectPriceDecimals(): number {
    if (!this.chartstate.chartData?.length) return 5;
    let max = 0;
    for (const c of this.chartstate.chartData.slice(0, 50)) {
      for (const v of [c.open, c.high, c.low, c.close]) {
        if (typeof v === 'number' && !isNaN(v)) {
          const s = v.toString();
          const d = s.indexOf('.');
          if (d !== -1) max = Math.max(max, s.length - d - 1);
        }
      }
    }
    return Math.min(max, 8);
  }

  public generateMockData(): any[] {
    const data: any[] = [];
    let base = 24000;
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    for (let i = 0; i < 90; i++) {
      const change = (Math.random() - 0.5) * 200;
      base = Math.max(22000, Math.min(26000, base + change));
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const open = base;
      const close = base + (Math.random() - 0.5) * 150;
      const high = Math.max(open, close) + Math.random() * 80;
      const low = Math.min(open, close) - Math.random() * 80;
      data.push({ time: Math.floor(d.getTime() / 1000), open, high, low, close });
    }
    return data;
  }

  public screenToChartPoint(sp: ScreenPoint): Point | null {
    try {
      if (sp.x < 0 || sp.y < 0) return null;
      const time = this.chartstate.chart.timeScale().coordinateToTime(sp.x) as number | null;
      const price = this.chartstate.candlestickSeries.coordinateToPrice(sp.y) as number | null;
      if (time == null || price == null || isNaN(time) || isNaN(price)) return null;
      return { x: sp.x, y: sp.y, time, price };
    } catch (err) {
      console.debug('[Chart] screenToChartPoint error:', err);
      return null;
    }
  }

  public chartToScreenPoint(time: number, price: number): ScreenPoint | null {
    try {
      const x = this.chartstate.chart.timeScale().timeToCoordinate(time) as number | null;
      const y = this.chartstate.candlestickSeries.priceToCoordinate(price) as number | null;
      if (x == null || y == null || isNaN(x) || isNaN(y)) return null;
      return { x, y };
    } catch (err) {
      console.debug('[Chart] chartToScreenPoint error:', err);
      return null;
    }
  }

  public countBarsInRange(fromTime: number, toTime: number): number {
    return this.chartstate.chartData.filter((d: any) => d.time >= fromTime && d.time <= toTime)
      .length;
  }

  public lockChartInteraction(): void {
    this.chartstate.chart?.applyOptions({
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
      handleScale: { mouseWheel: false, pinch: false, axisPressedMouseMove: false },
    });
  }

  public unlockChartInteraction(): void {
    this.chartstate.chart?.applyOptions({
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
        axisDoubleClickReset: { time: true, price: true },
      },
    });
  }

  public async initChart(chartContainer: any, measureCanvas?: any): Promise<void> {
    const container = chartContainer.nativeElement;
    if (container.clientWidth === 0) {
      console.error('[Chart] Chart container zero width');
      return;
    }

    if (!document.getElementById('lc-cursor-override')) {
      const style = document.createElement('style');
      style.id = 'lc-cursor-override';
      style.textContent = `
          .chart-container,
          .chart-container *,
          .chart-container canvas,
          .tv-lightweight-charts,
          .tv-lightweight-charts *,
          .tv-lightweight-charts canvas {
            cursor: crosshair !important;
          }
        `;
      document.head.appendChild(style);
    }

    const t = this.chartstate.themes[this.chartstate.currentTheme];

    this.chartstate.chart = createChart(container, {
      width: container.clientWidth,
      height: 600,
      layout: {
        background: { color: t.background },
        textColor: t.textColor,
        fontFamily: 'Arial',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: t.gridColor, style: 1 },
        horzLines: { color: t.gridColor, style: 1 },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
        borderColor: t.borderColor,
        fixLeftEdge: false,
        fixRightEdge: false,
        rightOffset: 5,
        tickMarkFormatter: (time: any) => {
          const d = new Date(time * 1000);
          const month = d.toLocaleString('en-US', { month: 'short' });
          const day = d.getDate();
          return `${month} ${day}`;
        },
      },
      rightPriceScale: {
        visible: true,
        autoScale: true,
        borderVisible: true,
        borderColor: t.borderColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      leftPriceScale: { visible: false },
      crosshair: {
        mode: 0,
        vertLine: { color: '#758696', width: 1, style: 0, visible: true, labelVisible: true },
        horzLine: { color: '#758696', width: 1, style: 0, visible: true, labelVisible: true },
      },
      handleScroll: {
        vertTouchDrag: true,
        horzTouchDrag: true,
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      localization: {
        priceFormatter: (price: number) => this.formatPrice(price, chartContainer),
      },
    });

    const forceChartCursor = (): void => {
      container.style.cursor = 'crosshair';
      container.querySelectorAll('*').forEach((child: Element) => {
        (child as HTMLElement).style.cursor = 'crosshair';
      });
    };
    forceChartCursor();
    setTimeout(() => forceChartCursor(), 300);
    setTimeout(() => forceChartCursor(), 800);

    this.chartstate.candlestickSeries = this.chartstate.chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceLineVisible: false,
      lastValueVisible: false,
      priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
      },
    });

    this.chartstate.chart
      .priceScale('right')
      .applyOptions({ visible: true, autoScale: true, mode: 0 });
    this.chartstate.chart
      .timeScale()
      .applyOptions({ visible: true, timeVisible: true, secondsVisible: false });
    this.chartstate.chart.timeScale().fitContent();

    this.chartstate.chartClickSubscription?.();
    this.chartstate.chartCrosshairSubscription?.();

    this.chartstate.chartClickSubscription = this.chartstate.chart.subscribeClick((param: any) => {
      if (!param?.point) return;

      if (this.chartstate.activeTool === 'measure') {
        if (!this.chartstate.isMeasuring) {
    const sp: ScreenPoint = { x: param.point.x, y: param.point.y };
    const hitIndex = this.measureUsecase.getMeasurementAtPoint(sp, (t, p) => this.chartToScreenPoint(t, p));

    if (hitIndex !== null) {
      this.chartstate.selectedMeasureIndex = hitIndex;
      this.measureUsecase.renderMeasureFrame(
        measureCanvas,
        (time, price) => this.chartToScreenPoint(time, price),
        (from, to) => this.countBarsInRange(from, to),
      );
      return;
    }
    this.chartstate.selectedMeasureIndex = null;
  }
        this.measureUsecase.handleMeasureClick(
          param,
          (sp) => this.screenToChartPoint(sp),
          () => this.lockChartInteraction(),
          () => this.unlockChartInteraction(),
          measureCanvas,
          (time, price) => this.chartToScreenPoint(time, price),
          (from, to) => this.countBarsInRange(from, to),
        );
        return;
      }

      const drawingUsecase = this.injector.get(DrawingUsecase);

      if (this.chartstate.isDrawing) {
        drawingUsecase.handleChartClick(param);
        return;
      }

      if (this.chartstate.clickTimeout) {
        clearTimeout(this.chartstate.clickTimeout);
        this.chartstate.clickTimeout = null;
        this.chartstate.isDoubleClick = true;

        if (this.chartstate.activeTool === 'select') {
          const sp: ScreenPoint = { x: param.point.x, y: param.point.y };
          const selectionUsecase = this.injector.get(SelectionUsecase);
          const hit = selectionUsecase.getTargetLine(sp, (t, p) => this.chartToScreenPoint(t, p));
          if (hit) {
            this.chartstate.selectedLineId = hit.id!;
            const duplicateUsecase = this.injector.get(DuplicateUsecase);
            duplicateUsecase.duplicateSelectedLine();
          }
        }
        return;
      }

      this.chartstate.isDoubleClick = false;
      this.chartstate.clickTimeout = setTimeout(() => {
        this.chartstate.clickTimeout = null;
        if (this.chartstate.isDoubleClick) {
          this.chartstate.isDoubleClick = false;
          return;
        }

        if (this.chartstate.activeTool === 'select') {
          const selectionUsecase = this.injector.get(SelectionUsecase);
          if (this.chartstate.dragDistance <= 5) {
            selectionUsecase.handleSelectClick(
              param,
              (time, price) => this.chartToScreenPoint(time, price),
              () => this.renderLines(),
              (from, to) => this.countBarsInRange(from, to),   
      measureCanvas,  
            );
          }
          this.chartstate.dragDistance = 0;
        } else {
          drawingUsecase.handleChartClick(param);
        }
      }, 200);
    });

    this.chartstate.chartCrosshairSubscription = this.chartstate.chart.subscribeCrosshairMove(
      (param: any) => {
        if (!param?.point) return;

        if (this.chartstate.activeTool === 'measure' && this.chartstate.isMeasuring) {
          const cp = this.screenToChartPoint({ x: param.point.x, y: param.point.y });
          if (cp) {
            this.chartstate.measureEnd = cp;
            this.measureUsecase.renderMeasureFrame(
              measureCanvas,
              (time, price) => this.chartToScreenPoint(time, price),
              (from, to) => this.countBarsInRange(from, to),
            );
          }
          return;
        }
        if (
          this.chartstate.isDrawing &&
          this.chartstate.hasFirstPoint &&
          this.chartstate.previewSeries
        ) {
          const drawingUsecase = this.injector.get(DrawingUsecase);
          drawingUsecase.updatePreviewLine(param);
        }
      },
    );

    this.chartstate.chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      if (!this.ensureChart()) return;
      this.chartstate.chart.priceScale('right').applyOptions({ visible: true });
      this.chartstate.chart.timeScale().applyOptions({ visible: true });

      if (this.chartstate.measureStart && this.chartstate.measureEnd) {
        this.measureUsecase.renderMeasureFrame(
          measureCanvas,
          (time, price) => this.chartToScreenPoint(time, price),
          (from, to) => this.countBarsInRange(from, to),
        );
      }
    });

    await this.loadChartData();

    setTimeout(() => {
      this.measureUsecase.setupMeasureCanvas(measureCanvas, chartContainer);
    }, 100);

    container.addEventListener(
      'contextmenu',
      (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      },
      true,
    );
  }

  private async loadChartData(): Promise<void> {
    if (isNaN(this.chartstate.testId) || this.chartstate.testId <= 0) {
      this.chartstate.rawChartData = this.generateMockData();
      this.chartstate.chartData = this.resampleData(
        this.chartstate.rawChartData,
        this.chartstate.activeTimeframe,
      );
      this.applyChartData();
      return;
    }
  }

  public handleWheelZoom(event: WheelEvent, chartContainer: any): void {
    if (!event.ctrlKey && !event.metaKey) return;
    if (!this.ensureChart()) return;
    event.preventDefault();
    event.stopPropagation();

    const container = chartContainer?.nativeElement;
    if (!container) return;
    const h = container.clientHeight;
    const visTop = this.chartstate.candlestickSeries.coordinateToPrice(0) as number | null;
    const visBot = this.chartstate.candlestickSeries.coordinateToPrice(h) as number | null;
    const visMid = this.chartstate.candlestickSeries.coordinateToPrice(event.offsetY) as
      | number
      | null;

    if (visTop == null || visBot == null || visMid == null) return;
    if (isNaN(visTop) || isNaN(visBot) || isNaN(visMid)) return;

    const visRange = visTop - visBot;
    if (visRange <= 0) return;

    const factor = event.deltaY > 0 ? 1.12 : 0.88;
    const newRange = visRange * factor;
    const ratioFromBottom = (visMid - visBot) / visRange;
    const newMin = visMid - ratioFromBottom * newRange;
    const newMax = newMin + newRange;

    this.chartstate.zoomMinPrice = newMin;
    this.chartstate.zoomMaxPrice = newMax;
    this.chartstate.isZoomed = true;

    this.chartstate.chart.priceScale('right').applyOptions({ autoScale: false });
    this.chartstate.chart
      .priceScale('right')
      .setVisiblePriceRange({ minValue: newMin, maxValue: newMax });
  }

  public _containerMouseDownCapture(event: MouseEvent, chartContainer: any): void {
    const container = chartContainer?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sp: ScreenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  public setupHandleCanvas(handleCanvas: any, chartContainer: any): void {
    const canvas = handleCanvas?.nativeElement;
    const container = chartContainer?.nativeElement;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    this.chartstate.handleCanvasContext = canvas.getContext('2d');
    this.chartstate.handleCanvasContext?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.startHandleRendering(handleCanvas);
  }

  private handleAnimationFrameId: number | null = null;

  private startHandleRendering(handleCanvas: any): void {
    if (this.handleAnimationFrameId) cancelAnimationFrame(this.handleAnimationFrameId);
    const draw = () => {
      this.drawHandles(handleCanvas);
      this.handleAnimationFrameId = requestAnimationFrame(draw);
    };
    this.handleAnimationFrameId = requestAnimationFrame(draw);
  }
public drawHandles(handleCanvas: any): void {
  const ctx = this.chartstate.handleCanvasContext;
  const canvas = handleCanvas?.nativeElement;
  if (!ctx || !canvas) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  this.chartstate.newDrawLine
    .filter((l) => !l.is_delete)
    .forEach((l) => this.drawLineLabel(ctx, l));

  if (this.chartstate.hasSubmitted) {
    this.chartstate.adminLines.forEach((l) => this.drawLineLabel(ctx, l, true));
  }

  if (!this.chartstate.selectedLineId) return;
  const line = this.chartstate.findLine(this.chartstate.selectedLineId);
  if (!line) return;

  const sp = this.chartToScreenPoint(line.start_time, line.start_price);
  const ep = this.chartToScreenPoint(line.end_time, line.end_price);
  if (!sp || !ep) return;

  this.drawHandle(ctx, sp.x, sp.y, this.chartstate.isExtendingLeftHandle);
  this.drawHandle(ctx, ep.x, ep.y, this.chartstate.isExtendingRightHandle);
}

  private drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, isActive: boolean): void {
    const radius = isActive ? 4 : 3;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius + 1, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? 'rgba(255,165,0,0.3)' : 'rgba(255,165,0,0.15)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#FFA500' : '#FF8C00';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  
/** Draws the line's name centered above its midpoint. Skips lines whose midpoint can't be resolved to screen space and skips the line currently being renamed (the <input> overlay covers that spot instead). */
private drawLineLabel(ctx: CanvasRenderingContext2D, line: Answers, isAdmin: boolean = false): void {
  const text = (line.tag?.trim()) || (isAdmin ? '' : '');
  if (!text) return; // only true for admin lines with no tag — those should stay invisible
  if (this.chartstate.editingLabelLineId === String(line.id)) return;

  const sp = this.chartToScreenPoint(line.start_time, line.start_price);
  const ep = this.chartToScreenPoint(line.end_time, line.end_price);
  if (!sp || !ep) return;

  const midX = (sp.x + ep.x) / 2;
  const midY = (sp.y + ep.y) / 2;
  const isSelected = !isAdmin && this.chartstate.selectedLineId === line.id;
  const isDark = this.chartstate.currentTheme === 'dark';
  const isPlaceholder = !line.tag?.trim() && !isAdmin;

  let bgColor: string, borderColor: string, textColor: string;
  if (isAdmin) {
    bgColor = 'rgba(54,247,179,0.85)';
    borderColor = '#36F7B3';
    textColor = '#0d1a15';
  } else if (isPlaceholder) {
    // Dashed/muted so it visually reads as "needs a tag"
    bgColor = isDark ? 'rgba(255,165,0,0.25)' : 'rgba(255,193,89,0.35)';
    borderColor = '#FFA500';
    textColor = isDark ? '#FFA500' : '#8a5300';
  } else if (isSelected) {
    bgColor = isDark ? 'rgba(255,165,0,0.85)' : 'rgba(255,193,89,0.9)';
    borderColor = isDark ? '#FFA500' : '#FF8C00';
    textColor = isDark ? '#FFFFFF' : '#1e222d';
  } else if (isDark) {
    bgColor = 'rgba(30,34,45,0.85)';
    borderColor = '#FF6B6B';
    textColor = '#FFFFFF';
  } else {
    bgColor = 'rgba(255,255,255,0.9)';
    borderColor = '#4ECDC4';
    textColor = '#333333';
  }

  ctx.save();
  ctx.font = '600 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const paddingX = 6;
  const paddingY = 3;
  const metrics = ctx.measureText(text);
  const boxW = metrics.width + paddingX * 2;
  const boxH = 16;
  const labelY = midY - 10;

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  if (isPlaceholder) ctx.setLineDash([2, 2]); // dashed border signals "not yet set"
  this.roundRect(ctx, midX - boxW / 2, labelY - boxH, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = textColor;
  ctx.fillText(text, midX, labelY - paddingY);
  ctx.restore();
}
private roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Hit-tests a screen point against every line's label box (same geometry as drawLineLabel). Returns the matching line, or null. */
public getLabelAtPoint(sp: ScreenPoint): Answers | null {
  const ctx = this.chartstate.handleCanvasContext;
  if (!ctx) return null;
  ctx.save();
  ctx.font = '600 11px Arial';

  for (const line of this.chartstate.newDrawLine) {
    if (line.is_delete) continue;
    const text = line.tag?.trim() || 'Tag ▾'; // ← same fallback as drawLineLabel

    const start = this.chartToScreenPoint(line.start_time, line.start_price);
    const end = this.chartToScreenPoint(line.end_time, line.end_price);
    if (!start || !end) continue;

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const paddingX = 6;
    const boxW = ctx.measureText(text).width + paddingX * 2;
    const boxH = 16;
    const labelY = midY - 10;

    const left = midX - boxW / 2;
    const top = labelY - boxH;
    if (sp.x >= left && sp.x <= left + boxW && sp.y >= top && sp.y <= labelY) {
      ctx.restore();
      return line;
    }
  }
  ctx.restore();
  return null;
}


  public clearHandlesCanvas(handleCanvas: any): void {
    const ctx = this.chartstate.handleCanvasContext;
    const canvas = handleCanvas?.nativeElement;
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }

  public async reconcileLinesWithLocalDb(localdb: LocalDatabaseService): Promise<void> {
    const dbLines = await localdb.getByChartAndTask(
      this.chartstate.chartId,
      this.chartstate.taskId,
    );

    // Lines that exist in localdb but aren't currently in memory → pull them in,
    // but never exceed requiredLineCount (guards against stale/orphaned rows
    // from a previous session pushing the total over the cap).
    const inMemoryIds = new Set(
      this.chartstate.newDrawLine.map((l) => l.localDbId).filter(Boolean),
    );
    for (const row of dbLines) {
      if (
        row.id &&
        !inMemoryIds.has(row.id) &&
        this.chartstate.newDrawLine.filter((l) => !l.is_delete).length <
          this.chartstate.requiredLineCount
      ) {
        this.chartstate.newDrawLine.push({
          ...row,
          localDbId: row.id,
          id: (row as any).uuid ?? uuidv4(),
        });
      }
    }

    // Lines that exist in memory (e.g., loaded from server/API) but have no localDbId yet → persist them
    for (const line of this.chartstate.newDrawLine) {
      if (!line.localDbId) {
        const saved = await localdb.createUserAnswer({
          answer_id: line.answer_id ?? null,
          chart_id: this.chartstate.chartId,
          task_id: this.chartstate.taskId,
          start_price: line.start_price,
          end_price: line.end_price,
          start_time: line.start_time,
          end_time: line.end_time,
          start_x: 0,
          end_x: 0,
          start_y: 0,
          end_y: 0,
          is_edit: line.is_edit ?? false,
          is_delete: false,
          tag: line.tag ?? '',
        } as Answers);
        line.localDbId = saved.id;
      }
    }

    this.renderLines();
  }

  public renderLine(line: Answers, id: string): void {
    if (!this.ensureChart()) return;
    try {
      const existing = this.chartstate.lineSeriesMap.get(id);
      if (existing) {
        try {
          this.chartstate.chart.removeSeries(existing);
        } catch {}
        this.chartstate.lineSeriesMap.delete(id);
      }
      let t1 = Number(line.start_time);
    let t2 = Number(line.end_time);
    let p1 = Number(line.start_price);
    let p2 = Number(line.end_price);

    if (!Number.isFinite(t1) || !Number.isFinite(t2) || !Number.isFinite(p1) || !Number.isFinite(p2)) {
      console.warn('[Chart] Skipping line with invalid numeric data:', line);
      return;
    }

    // lightweight-charts requires strictly ascending times. Reversed or
    // collapsed (equal) endpoints will otherwise throw on setData().
    if (t1 === t2) {
      t2 = t1 + 1;
    } else if (t1 > t2) {
      [t1, t2] = [t2, t1];
      [p1, p2] = [p2, p1];
    }


      let color = '#FF6B6B'; // default user-drawn
      const isSelected = this.chartstate.selectedLineId === line.id;
      let lineStyle = LineStyle.Solid;
      if (this.chartstate.hasSubmitted && this.chartstate.userLineResults.has(id)) {
        const isCorrect = this.chartstate.userLineResults.get(id);
        const isDarkTheme = this.chartstate.currentTheme === 'dark';
        color = isCorrect
          ? isDarkTheme
            ? '#FFFFFF'
            : '#000000' // White in dark theme, Black in light theme
          : '#E74C3C'; // Red if incorrect
        lineStyle = isCorrect ? LineStyle.Solid : LineStyle.Dotted;
      } else if (isSelected) {
        color = '#FFA500';
      }

      const series = this.chartstate.chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        lineStyle,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      series.setData([
      { time: t1, value: p1 },
      { time: t2, value: p2 },
    ]);
      this.chartstate.lineSeriesMap.set(id, series);
    } catch (e) {
      console.error('[Chart] renderLine error:', e, line);
    }
  }

  public validateLinesPixelBased(
  adminLines: Answers[],
  userLines: Answers[],
): Map<number, boolean> {
  const results = new Map<number, boolean>();
  const PIXEL_TOLERANCE = 5; // px — tune this to taste

  for (const user of userLines) {
    let matched = false;

    const userStartPx = this.chartToScreenPoint(user.start_time, user.start_price);
    const userEndPx = this.chartToScreenPoint(user.end_time, user.end_price);
    if (!userStartPx || !userEndPx) {
      results.set(user.id!, false);
      continue;
    }

    for (const admin of adminLines) {
      // Tag must match first — a perfectly-placed line drawn under the
      // wrong tag should never count as correct.
      if ((user.tag ?? '').trim() !== (admin.tag ?? '').trim()) continue;

      const adminStartPx = this.chartToScreenPoint(admin.start_time, admin.start_price);
      const adminEndPx = this.chartToScreenPoint(admin.end_time, admin.end_price);
      if (!adminStartPx || !adminEndPx) continue;

      const startDist = Math.hypot(
        userStartPx.x - adminStartPx.x,
        userStartPx.y - adminStartPx.y,
      );
      const endDist = Math.hypot(userEndPx.x - adminEndPx.x, userEndPx.y - adminEndPx.y);

      if (startDist <= PIXEL_TOLERANCE && endDist <= PIXEL_TOLERANCE) {
        matched = true;
        break;
      }
    }

    results.set(user.id!, matched);
  }

  return results;
}
  private removeLineSeries(id: string): void {
    const existing = this.chartstate.lineSeriesMap.get(id);
    if (existing) {
      try {
        this.chartstate.chart.removeSeries(existing);
      } catch {}
      this.chartstate.lineSeriesMap.delete(id);
    }
    const existingEnd = this.chartstate.lineSeriesMap.get(id + ':end');
    if (existingEnd) {
      try {
        this.chartstate.chart.removeSeries(existingEnd);
      } catch {}
      this.chartstate.lineSeriesMap.delete(id + ':end');
    }
  }

  private renderAdminOverlay(): void {
    this.adminLineSeriesMap.forEach((series) => {
      try {
        this.chartstate.chart.removeSeries(series);
      } catch {}
    });
    this.adminLineSeriesMap.clear();

    if (!this.chartstate.hasSubmitted) return;

    this.chartstate.adminLines.forEach((line) => {
      const series = this.chartstate.chart.addSeries(LineSeries, {
        color: '#36F7B3', // single distinct color for ALL admin lines
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      series.setData([
        { time: Number(line.start_time), value: Number(line.start_price) },
        { time: Number(line.end_time), value: Number(line.end_price) },
      ]);
      this.adminLineSeriesMap.set(String(line.id), series);
    });
  }

  private renderLinesWithoutScaleReset(): void {
    if (!this.ensureChart()) return;

    const wasZoomed = this.chartstate.isZoomed;
    const savedMin = this.chartstate.zoomMinPrice;
    const savedMax = this.chartstate.zoomMaxPrice;

    if (wasZoomed && savedMin != null && savedMax != null) {
      this.chartstate.chart.priceScale('right').applyOptions({ autoScale: false });
    }

    this.chartstate.lineSeriesMap.forEach((series) => {
      try {
        this.chartstate.chart.removeSeries(series);
      } catch {}
    });
    this.chartstate.lineSeriesMap.clear();

    this.chartstate.newDrawLine
      .filter((line) => !line.is_delete)
      .forEach((line) => this.renderLine(line, String(line.id)));

    // Admin overlay — only visible post-submit, rendered on its own map so
    // it's never confused with (or overwritten by) user line rendering.
    this.renderAdminOverlay();

    this.chartstate.chart.timeScale().applyOptions({ visible: true });

    if (wasZoomed && savedMin != null && savedMax != null) {
      this.chartstate.chart.priceScale('right').applyOptions({ autoScale: false });
      this.chartstate.chart
        .priceScale('right')
        .setVisiblePriceRange({ minValue: savedMin, maxValue: savedMax });
    }
  }

  public async seedLinesFromServer(
    serverLines: any[],
    localdb: LocalDatabaseService,
  ): Promise<void> {
    this.chartstate.requiredLineCount = serverLines.length;

    

    // Admin lines kept OUT of newDrawLine — never rendered/persisted as user
    // answers, only used for validation + the post-submit overlay.
    this.chartstate.adminLines = serverLines.map(
  (server) =>
    ({
      id: uuidv4(),
      answer_id: server.id ?? null,
      task_id: this.chartstate.taskId,
      chart_id: this.chartstate.chartId,
      start_time: Number(server.start_time),
      start_price: Number(server.start_price),
      end_time: Number(server.end_time),
      end_price: Number(server.end_price),
      is_edit: false,
      tag: server.tag || server.title,
    }) as Answers,
);

// Per-tag required counts (e.g. { CHO: 3, STR: 2 }) — drives the header breakdown.
this.chartstate.requiredCountByTag = this.chartstate.adminLines.reduce(
  (acc, line) => {
    const tag = (line.tag ?? '').trim() || 'Untagged';
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  },
  {} as Record<string, number>,
);
this.chartstate.matchedCountByTag = {};

    // Persist to answerChart so validateLinesAgainstDb() and any reload have
    // something to read.
    await localdb.saveAdminLines(
      this.chartstate.chartId,
      this.chartstate.taskId,
      this.chartstate.adminLines,
    );

    // Clear-on-open: wipe any stale user draft lines from a previous session
    // for this chart/task before loading a fresh in-memory array.
    await localdb.deleteUserLinesByChartAndTask(this.chartstate.chartId, this.chartstate.taskId);
    this.chartstate.newDrawLine = [];

    // Reset submit/result state for the new session.
    this.chartstate.hasSubmitted = false;
    this.chartstate.matchedCount = 0;
    this.chartstate.userLineResults.clear();
  }
}
