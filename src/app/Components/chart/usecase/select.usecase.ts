import { Injectable } from '@angular/core';
import { ChartState } from '../state/chart.state';
import { ScreenPoint } from '../model/drawing.model';
import { Answers } from '../model/chart.model';
import { ToastService } from '../../../../services/engine/toast.service';

@Injectable({ providedIn: 'root' })
export class SelectionUsecase {
  constructor(
    private chartState: ChartState,
    private toast: ToastService,
  ) {}

  handleSelectClick(
    param: any,
    chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
    onSelectionChanged: () => void,
  ): void {
    const sp: ScreenPoint = { x: param.point.x, y: param.point.y };

    if (this.getHandleAtPoint(sp, chartToScreenPoint)) return;
    if (this.chartState.isDraggingLine) return;

    const hit = this.getLineAtPoint(sp, chartToScreenPoint);
    if (hit) {
      this.chartState.selectedLineId = hit.id!;
      onSelectionChanged();
      this.toast.success(`Line selected: ${hit.id!.toString().substring(0, 8)}…`);
    } else {
      this.clearSelection();
      onSelectionChanged();
      this.toast.info('Selection cleared');
    }
  }

  getLineAtPoint(
    sp: ScreenPoint,
    chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
  ): Answers | null {
    for (const line of this.chartState.newDrawLine) {
      if (line.is_delete) continue;
      const a = chartToScreenPoint(line.start_time, line.start_price);
      const b = chartToScreenPoint(line.end_time, line.end_price);
      if (a && b && this.distanceToSegment(sp, a, b) < 10) return line;
    }
    return null;
  }

  getHandleAtPoint(
    sp: ScreenPoint,
    chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
  ): { type: 'left' | 'right'; lineId: any } | null {
    if (!this.chartState.selectedLineId) return null;
    const line = this.chartState.findLine(this.chartState.selectedLineId);
    if (!line) return null;

    const s = chartToScreenPoint(line.start_time, line.start_price);
    const e = chartToScreenPoint(line.end_time, line.end_price);
    if (!s || !e) return null;

    if (Math.hypot(sp.x - s.x, sp.y - s.y) < 8) return { type: 'left', lineId: line.id! };
    if (Math.hypot(sp.x - e.x, sp.y - e.y) < 8) return { type: 'right', lineId: line.id! };
    return null;
  }

  distanceToSegment(p: ScreenPoint, a: ScreenPoint, b: ScreenPoint): number {
    const abx = b.x - a.x, aby = b.y - a.y;
    const apx = p.x - a.x, apy = p.y - a.y;
    const lenSq = abx * abx + aby * aby;
    if (lenSq === 0) return Math.hypot(apx, apy);
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));
    return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
  }

  clearSelection(): void {
    this.chartState.selectedLineId = null;
  }

  getTargetLine(
    sp: ScreenPoint,
    chartToScreenPoint: (time: number, price: number) => ScreenPoint | null,
  ): Answers | null {
    if (this.chartState.selectedLineId) {
      const selected = this.chartState.findLine(this.chartState.selectedLineId);
      if (selected && !selected.is_delete) {
        const a = chartToScreenPoint(selected.start_time, selected.start_price);
        const b = chartToScreenPoint(selected.end_time, selected.end_price);
        if (a && b && this.distanceToSegment(sp, a, b) < 10) return selected;
      }
    }
    return this.getLineAtPoint(sp, chartToScreenPoint);
  }
}