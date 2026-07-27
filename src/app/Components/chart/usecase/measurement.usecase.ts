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
      this.toast.info('Measure: click a second point to finish.');
    } else {
      this.measureState.measureEnd = cp;
      this.measureState.isMeasuring = false;
      unlockChartInteraction();
      this.drawMeasureOverlay(measureCanvas, chartToScreenPoint, countBarsInRange);
      this.toast.info('Measure complete. Click again to start a new measurement.');
    }
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
}