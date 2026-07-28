import { Injectable } from '@angular/core';
import { Point, ScreenPoint } from '../model/drawing.model';
import { ChartState } from '../state/chart.state';
import { Answers, LineRecord } from '../model/chart.model';
import { ToolsUsecase } from './tools.usecase';
import { JsonToCandleUsecase } from './jsonTocandle.usecase';
import { LocalDatabaseService } from '../../../../services/engine/localdatabase.service';
import { LineSeries } from 'lightweight-charts';

export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Injectable()
export class DrawingUsecase {
  constructor(
    public chartState: ChartState,
    public ToolsUsecase: ToolsUsecase,
    public localdb: LocalDatabaseService,
    public JsonToCandleUsecase: JsonToCandleUsecase,
  ) {}

  public handleChartClick(param: any): void {
    if (
      !this.chartState.isDrawing &&
      this.chartState.activeTool === 'trendline' &&
      this.chartState.remainingLines <= 0
    ) {
      return; // block starting a new line once the required count is reached
    }
    const sp: ScreenPoint = { x: param.point.x, y: param.point.y };
    const cp = this.screenToChartPoint(sp);
    if (!cp) return;

    if (!this.chartState.isDrawing) {
      this.chartState.isDrawing = true;
      this.chartState.drawingStartPoint = cp;

      let previewColor = '#4ECDC4';
      let previewLineStyle = 0;
      if (this.chartState.activeTool === 'hline') {
        previewColor = '#FFFFFF';
        previewLineStyle = 1;
      }

      this.chartState.previewSeries = this.chartState.chart.addSeries(LineSeries, {
        color: previewColor,
        lineWidth: 1,
        lineStyle: previewLineStyle,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      this.chartState.hasFirstPoint = true;
    } else {
      let endPoint = cp;
      if (this.chartState.shiftHeld)
        endPoint = this.snapToAngle(this.chartState.drawingStartPoint!, cp);
      this.finishDrawing(endPoint);
      this.ToolsUsecase.cancelDrawing();
    }
  }

  private snapToAngle(start: Point, end: Point): Point {
    const ss = this.chartToScreenPoint(start.time, start.price);
    const es = this.chartToScreenPoint(end.time, end.price);
    if (!ss || !es) return end;
    const dx = es.x - ss.x,
      dy = es.y - ss.y;
    const nx = Math.abs(dx) >= Math.abs(dy) ? es.x : ss.x;
    const ny = Math.abs(dx) >= Math.abs(dy) ? ss.y : es.y;
    return this.screenToChartPoint({ x: nx, y: ny }) ?? end;
  }

  public chartToScreenPoint(time: number, price: number): ScreenPoint | null {
    try {
      const x = this.chartState.chart.timeScale().timeToCoordinate(time) as number | null;
      const y = this.chartState.candlestickSeries.priceToCoordinate(price) as number | null;
      if (x == null || y == null || isNaN(x) || isNaN(y)) return null;
      return { x, y };
    } catch (err) {
      console.debug('[Chart] chartToScreenPoint error:', err);
      return null;
    }
  }

  private screenToChartPoint(sp: ScreenPoint): Point | null {
    try {
      if (sp.x < 0 || sp.y < 0) return null;
      const time = this.chartState.chart.timeScale().coordinateToTime(sp.x) as number | null;
      const price = this.chartState.candlestickSeries.coordinateToPrice(sp.y) as number | null;
      if (time == null || price == null || isNaN(time) || isNaN(price)) return null;
      return { x: sp.x, y: sp.y, time, price };
    } catch (err) {
      console.debug('[Chart] Coordinate conversion error:', err);
      return null;
    }
  }

  private async finishDrawing(endPoint: Point): Promise<void> {
    let start: Point, end: Point;

    if (this.chartState.activeTool === 'straightline') {
      return;
    } else {
      if (!this.chartState.drawingStartPoint) return;
      start = { ...this.chartState.drawingStartPoint };
      end = { ...endPoint };
      if (this.chartState.activeTool === 'hline') end.price = start.price;
      if (
        this.chartState.activeTool !== 'ray' &&
        this.chartState.activeTool !== 'vline' &&
        start.time > end.time
      ) {
        [start, end] = [end, start];
      }
    }
    const newLines: Answers = {
      id: uuidv4(),
      task_id: this.chartState.testId,
      chart_id: this.chartState.chartId,
      start_x: start.x,
      start_y: start.y,
      end_x: end.x,
      end_y: end.y,
      start_time: start.time,
      start_price: start.price,
      end_time: end.time,
      end_price: end.price,
      is_edit: false,
      tag:'Select a name'
    };

    this.ToolsUsecase.pushUndo();
    this.chartState.newDrawLine.push(newLines);

    this.chartState.pendingSaves++;
    try {
      const savedRecord = await this.localdb.createUserAnswer(this.toLineRecord(newLines, false, false));
      newLines.localDbId = (savedRecord as Answers).id;
    } finally {
      this.chartState.pendingSaves--;
    }

    this.JsonToCandleUsecase.renderLines();
  }

  private toLineRecord(
    line: Answers,
    isEdit: boolean = false,
    isDelete: boolean = false,
  ): Omit<LineRecord, 'id' | 'created_at' | 'updated_at'> {
    const s = this.chartToScreenPoint(line.start_time, line.start_price);
    const e = this.chartToScreenPoint(line.end_time, line.end_price);

    return {
      answer_id: line.answer_id ?? null,
      chart_id: this.chartState.chartId,
      task_id: this.chartState.taskId,
      start_price: line.start_price,
      end_price: line.end_price,
      start_time: line.start_time,
      end_time: line.end_time,
      start_x: s?.x ?? 0,
      end_x: e?.x ?? 0,
      start_y: s?.y ?? 0,
      end_y: e?.y ?? 0,
      is_edit: isEdit,
      is_delete: isDelete,
      tag:line.tag
    };
  }

  public updatePreviewLine(param: any): void {
    if (this.chartState.updatingPreview || !this.chartState.isDrawing || !this.chartState.previewSeries) return;
    this.chartState.updatingPreview = true;
    try {
      const sp: ScreenPoint = { x: param.point.x, y: param.point.y };
      let cp = this.screenToChartPoint(sp);
      if (!cp) return;
      let end = { ...cp };
      if (this.chartState.shiftHeld) end = this.snapToAngle(this.chartState.drawingStartPoint!, end);
      if (this.chartState.activeTool === 'hline') end.price = this.chartState.drawingStartPoint!.price;
      if (this.chartState.activeTool === 'vline') end.time = this.chartState.drawingStartPoint!.time;

      if (this.chartState.activeTool === 'trendline') {
        this.chartState.previewSeries.applyOptions({ color: '#4ECDC4', lineWidth: 2, lineStyle: 0 });
      } else if (this.chartState.activeTool === 'hline') {
        this.chartState.previewSeries.applyOptions({ color: '#FFFFFF', lineWidth: 2, lineStyle: 1 });
      }

      if (this.chartState.activeTool === 'hline' || this.chartState.activeTool === 'ray') {
        const pts = this.getExtendedPoints(this.chartState.drawingStartPoint!, end);
        if (pts.length >= 2 && pts[0].time !== pts[1].time) this.chartState.previewSeries.setData(pts);
      } else {
        const t1 = this.chartState.drawingStartPoint!.time,
          t2 = end.time;
        if (t1 === t2) return;
        const ordered =
          t1 < t2
            ? [
                { time: t1, value: this.chartState.drawingStartPoint!.price },
                { time: t2, value: end.price },
              ]
            : [
                { time: t2, value: end.price },
                { time: t1, value: this.chartState.drawingStartPoint!.price },
              ];
        this.chartState.previewSeries.setData(ordered);
      }
    } catch (err) {
      console.warn('[Chart] Preview update error', err);
    } finally {
      this.chartState.updatingPreview = false;
    }
  }

  private getExtendedPoints(start: Point, end: Point): any[] {
    const tr = this.chartState.chart.timeScale().getVisibleRange();
    if (!tr) return [];
    const dt = end.time - start.time;
    const dp = end.price - start.price;
    if (dt === 0) return [{ time: start.time, value: start.price }];
    const m = dp / dt;
    const b = start.price - m * start.time;
    return [
      { time: tr.from as number, value: m * (tr.from as number) + b },
      { time: tr.to as number, value: m * (tr.to as number) + b },
    ];
  }
}