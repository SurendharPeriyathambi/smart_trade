import { Injectable } from '@angular/core';
import { ChartState } from '../state/chart.state';
import { JsonToCandleUsecase } from './jsonTocandle.usecase';
import { SelectionUsecase } from './select.usecase';

import { ScreenPoint } from '../model/drawing.model';
import { Answers } from '../model/chart.model';
import { uuidv4 } from './drawline.usecase';
import { LocalDatabaseService } from '../../../../services/engine/localdatabase.service';

@Injectable({ providedIn: 'root' })
export class DragUsecase {
  constructor(
    private chartState: ChartState,
    private candle: JsonToCandleUsecase,
    private selection: SelectionUsecase,
    private localdb: LocalDatabaseService,
  ) {}

  onMouseDown(event: MouseEvent, chartContainer: any): void {
    this.chartState.dragDistance = 0;
    this.chartState.isDragClone = false;

    if (this.chartState.activeTool !== 'select') return;

    const container = chartContainer?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (
      event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom
    ) return;

    const sp: ScreenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if (this.selection.getHandleAtPoint(sp, (t, p) => this.candle.chartToScreenPoint(t, p))) return;

    const target = this.selection.getTargetLine(sp, (t, p) => this.candle.chartToScreenPoint(t, p));
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    this.candle.lockChartInteraction();
    this.chartState.isDraggingLine = true;

    if (event.ctrlKey || event.metaKey) {
      if (this.chartState.remainingLines <= 0) {
        // Cap reached — fall through to a normal (non-clone) drag instead of cloning.
      } else {
        const clone: Answers = {
          ...structuredClone(target),
          id: uuidv4(),
          localDbId: null,
          answer_id: null,
          is_edit: false,
        };
        this.chartState.newDrawLine.push(clone);
        this.chartState.selectedLineId = clone.id!;
        this.chartState.draggedLineId = clone.id!;
        this.chartState.dragLineSnapshot = structuredClone(clone);
        this.chartState.isDragClone = true;

        const cp = this.candle.screenToChartPoint(sp);
        if (cp) this.chartState.dragStartPoint = { time: cp.time, price: cp.price };

        this.candle.renderLines();
        return;
      }
    }

    this.chartState.selectedLineId = target.id!;
    this.chartState.draggedLineId = target.id!;
    this.chartState.dragLineSnapshot = structuredClone(target);
    const cp = this.candle.screenToChartPoint(sp);
    if (cp) this.chartState.dragStartPoint = { time: cp.time, price: cp.price };

    this.candle.renderLines();
  }

  onMouseMove(event: MouseEvent, chartContainer: any): void {
    this.chartState.shiftHeld = event.shiftKey;
    if (!this.chartState.isDraggingLine || !this.chartState.draggedLineId) return;

    this.chartState.dragDistance += Math.abs(event.movementX) + Math.abs(event.movementY);

    const container = chartContainer?.nativeElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sp: ScreenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const curr = this.candle.screenToChartPoint(sp);
    if (!curr || !this.chartState.dragStartPoint || !this.chartState.dragLineSnapshot) return;

    const dt = curr.time - this.chartState.dragStartPoint.time;
    const dp = curr.price - this.chartState.dragStartPoint.price;
    const snap = this.chartState.dragLineSnapshot;

    const line = this.chartState.findLine(this.chartState.draggedLineId);
    if (!line) return;

    line.start_time = Math.round(snap.start_time + dt);
    line.end_time = Math.round(snap.end_time + dt);
    line.start_price = snap.start_price + dp;
    line.end_price = snap.end_price + dp;

    this.renderSingleLine(line);
  }

  onMouseUp(): void {
    if (!this.candle.ensureChart()) return;
    this.candle.unlockChartInteraction();

    const wasDragging = this.chartState.isDraggingLine && !!this.chartState.draggedLineId;
    const draggedId = this.chartState.draggedLineId;
    const wasClone = this.chartState.isDragClone;

    this.chartState.isDraggingLine = false;
    this.chartState.draggedLineId = null;
    this.chartState.dragLineSnapshot = null;
    this.chartState.dragStartPoint = null;
    this.chartState.dragDistance = 0;
    this.chartState.isDragClone = false;

    this.candle.renderLines();

    if (wasDragging && draggedId) {
      wasClone ? this.finishDragClone(draggedId) : this.saveDraggedLine(draggedId);
    }
  }

  async deleteLine(id: string): Promise<void> {
    const line = this.chartState.findLine(id);
    if (!line) return;

    if (line.localDbId) {
      await this.localdb.deleteAnswer(line.localDbId);
    }

    const existing = this.chartState.lineSeriesMap.get(String(line.id));
    if (existing) {
      try { this.chartState.chart.removeSeries(existing); } catch {}
      this.chartState.lineSeriesMap.delete(String(line.id));
    }
  }

  private async finishDragClone(cloneId: string): Promise<void> {
    const line = this.chartState.findLine(cloneId);
    if (!line) return;
    this.chartState.pendingSaves++;
    try {
      const saved = await this.localdb.createUserAnswer(this.toRecord(line) as Answers);
      line.localDbId = saved.id;
    } finally {
      this.chartState.pendingSaves--;
    }
  }

  private async saveDraggedLine(id: string): Promise<void> {
    const line = this.chartState.findLine(id);
    if (!line) return;
    line.is_edit = true;
    this.chartState.pendingSaves++;
    try {
      if (line.localDbId) {
        await this.localdb.updateAnswer(line.localDbId, this.toRecord(line) as Answers);
      } else {
        const saved = await this.localdb.createUserAnswer(this.toRecord(line) as Answers);
        line.localDbId = saved.id;
      }
    } finally {
      this.chartState.pendingSaves--;
    }
  }

  private renderSingleLine(line: Answers): void {
    // After submit, defer entirely to renderLine() so result colors
    // (green/red) aren't stomped by the hardcoded drag colors below.
    if (this.chartState.hasSubmitted) {
      this.candle.renderLine(line, String(line.id));
      return;
    }
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
      start_x: 0,
      end_x: 0,
      start_y: 0,
      end_y: 0,
      is_edit: !!line.localDbId,
      is_delete: false,
    };
  }
}