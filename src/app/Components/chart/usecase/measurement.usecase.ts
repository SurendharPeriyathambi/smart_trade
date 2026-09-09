import { Injectable, inject } from '@angular/core';
import { Point, ScreenPoint } from '../model/drawing.model';

import { ChartState } from '../state/chart.state';
import { ToastService } from '../../../../services/engine/toast.service';

@Injectable()
export class MeasureUsecase {
  public measureState = inject(ChartState);
  private toast = inject(ToastService);

  public setupMeasureCanvas(measureCanvas: any, chartContainer: any): void {
    const canvas = measureCanvas?.nativeElement;
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
    canvas.style.zIndex = '10';

    this.measureState.measureCtx = canvas.getContext('2d');
    this.measureState.measureCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public clearMeasureCanvas(measureCanvas: any): void {
    const canvas = measureCanvas?.nativeElement;
    if (!canvas || !this.measureState.measureCtx) return;
    const dpr = window.devicePixelRatio || 1;
    this.measureState.measureCtx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }

  public handleMeasureClick(
    param: any,
    screenToChartPoint: (sp: ScreenPoint) => Point | null,
    lockChartInteraction: () => void,
    unlockChartInteraction: () => void,
    measureCanvas: any,
    chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
    countBarsInRange: (fromTime: number, toTime: number) => number,
  ): void {
    const sp: ScreenPoint = { x: param.point.x, y: param.point.y };
    const cp = screenToChartPoint(sp);
    if (!cp) return;

    if (!this.measureState.isMeasuring) {
      this.measureState.measureStart = cp;
      this.measureState.measureEnd = cp;
      this.measureState.isMeasuring = true;
      lockChartInteraction();
      // this.toast.info('Measure: click a second point to finish.');
    } else {
      this.measureState.measureEnd = cp;
      this.measureState.isMeasuring = false;
      unlockChartInteraction();
      // commit to the list — previous measurements are untouched
    this.measureState.measurements.push({
      start: { ...this.measureState.measureStart },
      end: { ...this.measureState.measureEnd },
    });
      this.redrawAllMeasurements(measureCanvas, chartToScreenPoint, countBarsInRange);
      // this.toast.info('Measure complete. Click again to start a new measurement.');
    }
  }
 public redrawAllMeasurements(
  measureCanvas: any,
  chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
  countBarsInRange: (fromTime: number, toTime: number) => number,
): void {
  const ctx = this.measureState.measureCtx;
  const canvas = measureCanvas?.nativeElement;
  if (!ctx || !canvas) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  this.measureState.measurements.forEach((m: any, i: number) => {
    this.drawSingleMeasurement(
      ctx, canvas, m.start, m.end, chartToScreenPoint, countBarsInRange,
      i === this.measureState.selectedMeasureIndex, // isSelected
    );
  });
}
private drawSingleMeasurement(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  start: Point,
  end: Point,
  chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
  countBarsInRange: (fromTime: number, toTime: number) => number,
  isSelected: boolean = false,
  pipSize: number = 0.0001, 
): void {
  const dpr = window.devicePixelRatio || 1;

  const s = chartToScreenPoint(start.time, start.price);
  const e = chartToScreenPoint(end.time, end.price);
  if (!s || !e) return;

  const left = Math.min(s.x, e.x);
  const right = Math.max(s.x, e.x);
  const top = Math.min(s.y, e.y);
  const bottom = Math.max(s.y, e.y);
  const width = right - left;
  const height = bottom - top;
  if (width < 1) return;

  ctx.save();


  const isDown = end.price < start.price;
  const fillColor = isDown ? 'rgba(239, 83, 80, 0.15)' : 'rgba(41, 98, 255, 0.15)';
  // ✅ selected measurement gets a yellow border so the user can see what Delete will remove
  const strokeColor = isSelected ? 'rgba(255, 215, 0, 0.9)' : (isDown ? 'rgba(239, 83, 80, 0.6)' : 'rgba(41, 98, 255, 0.6)');
  const arrowColor = isDown ? 'rgba(239,83,80,0.9)' : 'rgba(41,98,255,0.9)';
  const tipBg = isDown ? 'rgba(239, 83, 80, 0.92)' : 'rgba(41, 98, 255, 0.92)';

  ctx.fillStyle = fillColor;
  ctx.fillRect(left, top, width, Math.max(height, 1));
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeRect(left, top, width, Math.max(height, 1));

  const midY = s.y;
  ctx.beginPath();
  ctx.moveTo(left, midY);
  ctx.lineTo(right, midY);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  this.drawArrow(ctx, s.x, midY, e.x, midY, arrowColor);
  if (height > 4) {
    const midX = left + width / 2;
    this.drawArrow(ctx, midX, midY, midX, e.y, arrowColor);
  }

  const deltaPrice = end.price - start.price;
  const deltaPercent = start.price !== 0 ? (deltaPrice / start.price) * 100 : 0;
  const deltaPips = deltaPrice / pipSize; // ✅ pip distance

  const deltaSec = Math.abs(end.time - start.time);
  const deltaHours = deltaSec / 3600;
  const deltaDays = Math.floor(deltaSec / 86400);
  const barCount = countBarsInRange(
    Math.min(start.time, end.time),
    Math.max(start.time, end.time),
  );

  const sign = deltaPrice >= 0 ? '+' : '';
  const pipSign = deltaPips >= 0 ? '+' : '';
  const priceStr = `${sign}${deltaPrice.toFixed(2)} (${sign}${deltaPercent.toFixed(2)}%) - (${pipSign}${deltaPips.toFixed(1)} pips)`;
  // const pipStr = `${pipSign}${deltaPips.toFixed(1)} pips`; 
  const timeStr =
    deltaDays > 0
      ? `${barCount} bars, ${deltaDays}d ${Math.round(deltaHours % 24)}h`
      : `${barCount} bars, ${Math.round(deltaHours)}h`;

  const padding = 8;
  const lineH = 18;
  const boxW = 210;
  const boxH = lineH * 3 + padding * 2; 

  let tipX = left + width / 2 - boxW / 2;
  let tipY = top - boxH - 8;
  if (tipY < 4) tipY = bottom + 8;
  const canvasW = canvas.width / dpr;
  tipX = Math.max(4, Math.min(tipX, canvasW - boxW - 4));

  ctx.fillStyle = tipBg;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tipX, tipY, boxW, boxH, 4);
  } else {
    ctx.rect(tipX, tipY, boxW, boxH);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Arial';
  ctx.fillText(priceStr, tipX + boxW / 2, tipY + padding + lineH - 4);
  ctx.font = '11px Arial';
   // ctx.fillText(pipStr, tipX + boxW / 2, tipY + padding + lineH * 2 - 4); 
  ctx.fillText(timeStr, tipX + boxW / 2, tipY + padding + lineH * 3 - 2);


  ctx.restore();
}
 

  public clearMeasure(measureCanvas: any, unlockChartInteraction?: () => void): void {
    this.measureState.measureStart = null;
    this.measureState.measureEnd = null;
    this.measureState.isMeasuring = false;
    this.clearMeasureCanvas(measureCanvas);
    unlockChartInteraction?.();
  }

  public drawMeasureOverlay(
    measureCanvas: any,
    chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
    countBarsInRange: (fromTime: number, toTime: number) => number,
  ): void {
    const ctx = this.measureState.measureCtx;
    if (!ctx || !this.measureState.measureStart || !this.measureState.measureEnd) return;

    const canvas = measureCanvas?.nativeElement;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const s = chartToScreenPoint(this.measureState.measureStart.time, this.measureState.measureStart.price);
    const e = chartToScreenPoint(this.measureState.measureEnd.time, this.measureState.measureEnd.price);
    if (!s || !e) return;

    const left = Math.min(s.x, e.x);
    const right = Math.max(s.x, e.x);
    const top = Math.min(s.y, e.y);
    const bottom = Math.max(s.y, e.y);
    const width = right - left;
    const height = bottom - top;
    if (width < 1) return;

    ctx.save();

    const isDown = this.measureState.measureEnd.price < this.measureState.measureStart.price;
    const fillColor = isDown ? 'rgba(239, 83, 80, 0.15)' : 'rgba(41, 98, 255, 0.15)';
    const strokeColor = isDown ? 'rgba(239, 83, 80, 0.6)' : 'rgba(41, 98, 255, 0.6)';
    const arrowColor = isDown ? 'rgba(239,83,80,0.9)' : 'rgba(41,98,255,0.9)';
    const tipBg = isDown ? 'rgba(239, 83, 80, 0.92)' : 'rgba(41, 98, 255, 0.92)';

    ctx.fillStyle = fillColor;
    ctx.fillRect(left, top, width, Math.max(height, 1));
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, width, Math.max(height, 1));

    const midY = s.y;
    ctx.beginPath();
    ctx.moveTo(left, midY);
    ctx.lineTo(right, midY);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    this.drawArrow(ctx, s.x, midY, e.x, midY, arrowColor);
    if (height > 4) {
      const midX = left + width / 2;
      this.drawArrow(ctx, midX, midY, midX, e.y, arrowColor);
    }

    const deltaPrice = this.measureState.measureEnd.price - this.measureState.measureStart.price;
    const deltaPercent =
      this.measureState.measureStart.price !== 0
        ? (deltaPrice / this.measureState.measureStart.price) * 100
        : 0;
    const deltaSec = Math.abs(this.measureState.measureEnd.time - this.measureState.measureStart.time);
    const deltaHours = deltaSec / 3600;
    const deltaDays = Math.floor(deltaSec / 86400);
    const barCount = countBarsInRange(
      Math.min(this.measureState.measureStart.time, this.measureState.measureEnd.time),
      Math.max(this.measureState.measureStart.time, this.measureState.measureEnd.time),
    );

    const sign = deltaPrice >= 0 ? '+' : '';
    const priceStr = `${sign}${deltaPrice.toFixed(2)} (${sign}${deltaPercent.toFixed(2)}%)`;
    const timeStr =
      deltaDays > 0
        ? `${barCount} bars, ${deltaDays}d ${Math.round(deltaHours % 24)}h`
        : `${barCount} bars, ${Math.round(deltaHours)}h`;

    const padding = 8;
    const lineH = 18;
    const boxW = 210;
    const boxH = lineH * 2 + padding * 2;

    let tipX = left + width / 2 - boxW / 2;
    let tipY = top - boxH - 8;
    if (tipY < 4) tipY = bottom + 8;
    const canvasW = canvas.width / dpr;
    tipX = Math.max(4, Math.min(tipX, canvasW - boxW - 4));

    ctx.fillStyle = tipBg;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(tipX, tipY, boxW, boxH, 4);
    } else {
      ctx.rect(tipX, tipY, boxW, boxH);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(priceStr, tipX + boxW / 2, tipY + padding + lineH - 4);
    ctx.font = '11px Arial';
    ctx.fillText(timeStr, tipX + boxW / 2, tipY + padding + lineH * 2 - 2);

    ctx.restore();
  }

  private drawArrow(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string = 'rgba(255,255,255,0.8)',
  ): void {
    const headLen = 7;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
    /** Draws every committed measurement, then the in-progress one on top (if mid-drag).
 *  Use this everywhere drawMeasureOverlay used to be called. */
public renderMeasureFrame(
  measureCanvas: any,
  chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
  countBarsInRange: (fromTime: number, toTime: number) => number,
): void {
  this.redrawAllMeasurements(measureCanvas, chartToScreenPoint, countBarsInRange);

  if (this.measureState.isMeasuring && this.measureState.measureStart && this.measureState.measureEnd) {
    const ctx = this.measureState.measureCtx;
    const canvas = measureCanvas?.nativeElement;
    if (ctx && canvas) {
      this.drawSingleMeasurement(
        ctx, canvas,
        this.measureState.measureStart,
        this.measureState.measureEnd,
        chartToScreenPoint,
        countBarsInRange,
        false,
      );
    }
  }
}
/** Hit-tests a click against every committed measurement's bounding box (with a small margin). Returns the topmost (last-drawn) match, or null. */
public getMeasurementAtPoint(
  sp: ScreenPoint,
  chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
): number | null {
  for (let i = this.measureState.measurements.length - 1; i >= 0; i--) {
    const m = this.measureState.measurements[i];
    const s = chartToScreenPoint(m.start.time, m.start.price);
    const e = chartToScreenPoint(m.end.time, m.end.price);
    if (!s || !e) continue;

    const margin = 6;
    const left = Math.min(s.x, e.x) - margin;
    const right = Math.max(s.x, e.x) + margin;
    const top = Math.min(s.y, e.y) - margin;
    const bottom = Math.max(s.y, e.y) + margin;

    if (sp.x >= left && sp.x <= right && sp.y >= top && sp.y <= bottom) {
      return i;
    }
  }
  return null;
}

/** Permanently removes ONLY the currently selected measurement from the array, then repaints. */
public deleteSelectedMeasurement(
  measureCanvas: any,
  chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
  countBarsInRange: (fromTime: number, toTime: number) => number,
): boolean {
  const idx = this.measureState.selectedMeasureIndex;
  if (idx === null || idx === undefined) return false;

  this.measureState.measurements.splice(idx, 1); // real removal from state
  this.measureState.selectedMeasureIndex = null;
  this.redrawAllMeasurements(measureCanvas, chartToScreenPoint, countBarsInRange);
  return true;
}
}