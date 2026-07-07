import { Injectable } from '@angular/core';
import { ChartState } from '../state/chart.state';
import { JsonToCandleUsecase } from './jsonTocandle.usecase';
import { SelectionUsecase } from './select.usecase';

import { ScreenPoint } from '../model/drawing.model';
import { Answers } from '../model/chart.model';
import { LocalDatabaseService } from '../../../../services/engine/localdatabase.service';

@Injectable({ providedIn: 'root' })
export class ExtendUsecase {
  extendingLineId: string | null = null;
  showExtendControls = false;
  extendLeftValue = 0;
  extendRightValue = 0;

  constructor(
    private chartState: ChartState,
    private candle: JsonToCandleUsecase,
    private selection: SelectionUsecase,
    private localdb: LocalDatabaseService,
  ) {}

  onHandleMouseDown(handle: { type: 'left' | 'right'; lineId: string }): void {
    this.candle.lockChartInteraction();
    this.chartState.extendingLineIdHandle = handle.lineId;

    this.chartState.isExtendingLeftHandle = handle.type === 'left';
    this.chartState.isExtendingRightHandle = handle.type === 'right';
  }

  onMouseMove(event: MouseEvent, chartContainer: any): void {
    if (
      !(this.chartState.isExtendingLeftHandle || this.chartState.isExtendingRightHandle) ||
      !this.chartState.extendingLineIdHandle
    ) return;

    const container = chartContainer?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sp: ScreenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const cp = this.candle.screenToChartPoint(sp);
    if (!cp) return;

    const line = this.chartState.findLine(this.chartState.extendingLineIdHandle);
    if (!line) return;

    if (event.shiftKey) {
      this.applySnappedEndpoint(line, cp);
    } else {
      this.applyEndpoint(line, cp.time, cp.price);
    }

    this.renderSingleLine(line);
  }

  onMouseUp(): void {
    const wasExtending =
      (this.chartState.isExtendingLeftHandle || this.chartState.isExtendingRightHandle) &&
      !!this.chartState.extendingLineIdHandle;
    const extendingId = this.chartState.extendingLineIdHandle;

    this.chartState.isExtendingLeftHandle = false;
    this.chartState.isExtendingRightHandle = false;
    this.chartState.extendingLineIdHandle = null;

    this.candle.unlockChartInteraction();
    this.candle.renderLines();

    if (wasExtending && extendingId) this.saveExtendedLine(extendingId);
  }

  showExtensionControls(): void {
    if (!this.chartState.selectedLineId) return;
    this.extendingLineId = this.chartState.selectedLineId;
    this.showExtendControls = true;
    this.extendLeftValue = 0;
    this.extendRightValue = 0;
  }

  closeExtendControls(): void {
    this.showExtendControls = false;
    this.extendingLineId = null;
  }

  extendLineManually(): void {
    if (!this.extendingLineId) return;
    const line = this.chartState.findLine(this.extendingLineId);
    if (!line) return;

    const dt = line.end_time - line.start_time;
    const dp = line.end_price - line.start_price;
    const slope = dt !== 0 ? dp / dt : 0;
    const intercept = line.start_price - slope * line.start_time;
    const leftExt = this.extendLeftValue * 86400;
    const rightExt = this.extendRightValue * 86400;

    line.start_time -= leftExt;
    line.start_price = slope * line.start_time + intercept;
    line.end_time += rightExt;
    line.end_price = slope * line.end_time + intercept;

    this.candle.renderLines();
    this.saveExtendedLine(line.id!);
  }

  private applySnappedEndpoint(line: Answers, cp: { time: number; price: number }): void {
    const fixedTime = this.chartState.isExtendingLeftHandle ? line.end_time : line.start_time;
    const fixedPrice = this.chartState.isExtendingLeftHandle ? line.end_price : line.start_price;

    const spFixed = this.candle.chartToScreenPoint(fixedTime, fixedPrice);
    const spMoving = this.candle.chartToScreenPoint(cp.time, cp.price);
    if (!spFixed || !spMoving) return;

    const pixDx = spMoving.x - spFixed.x, pixDy = spMoving.y - spFixed.y;
    const absDx = Math.abs(pixDx), absDy = Math.abs(pixDy);
    const diagThreshold = Math.tan(Math.PI / 8);

    if (absDx === 0 && absDy === 0) return;

    if (absDy / (absDx || 1) < diagThreshold) {
      const snapped = this.candle.screenToChartPoint({ x: spMoving.x, y: spFixed.y });
      if (snapped) this.applyEndpoint(line, snapped.time, fixedPrice);
    } else if (absDx / (absDy || 1) < diagThreshold) {
      const snapped = this.candle.screenToChartPoint({ x: spFixed.x, y: spMoving.y });
      if (snapped) this.applyEndpoint(line, fixedTime, snapped.price);
    } else {
      const targetX = absDx >= absDy ? spMoving.x : spFixed.x + (pixDx >= 0 ? absDy : -absDy);
      const targetY = absDx >= absDy ? spFixed.y + (pixDy >= 0 ? absDx : -absDx) : spMoving.y;
      const snapped = this.candle.screenToChartPoint({ x: targetX, y: targetY });
      if (snapped) this.applyEndpoint(line, snapped.time, snapped.price);
    }
  }

  private applyEndpoint(line: Answers, time: number, price: number): void {
    if (this.chartState.isExtendingLeftHandle) {
      line.start_time = time;
      line.start_price = price;
    } else {
      line.end_time = time;
      line.end_price = price;
    }
  }

  private async saveExtendedLine(id: string): Promise<void> {
    const line = this.chartState.findLine(id);
    if (!line) return;
    line.is_edit = true;
    if (line.localDbId) {
      await this.localdb.updateAnswer(line.localDbId, this.toRecord(line) as Answers);
    } else {
      const saved = await this.localdb.createAnswer(this.toRecord(line) as Answers);
      line.localDbId = saved.id;
    }
  }

  private renderSingleLine(line: Answers): void {
    const isSelected = this.chartState.selectedLineId === line.id;
    const existing = this.chartState.lineSeriesMap.get(String(line.id));
    const data = [
      { time: line.start_time, value: line.start_price },
      { time: line.end_time, value: line.end_price },
    ];
    if (existing) {
      existing.applyOptions({ color: isSelected ? '#FFA500' : '#FF6B6B' });
      existing.setData(data);
      return;
    }
    this.candle.renderLine(line, String(line.id));
  }

  private toRecord(line: Answers) {
    return {
      answer_id: line.answer_id ?? null,
      chart_id: this.chartState.chartId,
      task_id: this.chartState.taskId,
      start_price: line.start_price,
      end_price: line.end_price,
      start_time: line.start_time,
      end_time: line.end_time,
      start_x: 0, end_x: 0, start_y: 0, end_y: 0,
      is_edit: !!line.localDbId,
      is_delete: false,
    };
  }
}