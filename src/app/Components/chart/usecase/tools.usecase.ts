import { Inject, inject, Injectable, Injector } from "@angular/core";
import { ChartState } from "../state/chart.state";

import { JsonToCandleUsecase } from "./jsonTocandle.usecase";
import { ToastService } from "../../../../services/engine/toast.service";
import { LocalDatabaseService } from "../../../../services/engine/localdatabase.service";
type ToolMode = 'trendline' | 'hline' | 'vline' | 'ray' | 'straightline' | 'select' | 'measure';

@Injectable({ providedIn: 'root' })
export class ToolsUsecase {
  private toast = inject(ToastService);
  constructor (public chartstate:ChartState,public injector:Injector,public localdb:LocalDatabaseService){

  }
   // ==================== TOOL SELECTION ====================
   public clearHandles(): void {
    // if (!this.chartstate.handleCanvasContext || !this.chartstate.handleCanvas?.nativeElement) return;
    // const canvas = this.handleCanvas.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    // this.handleCanvasContext.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }
   // ==================== DRAWING ====================

  /** Aborts an in-progress line draw: resets drawing flags, stops hint blinks, unlocks the chart, and removes the temporary preview series. */
  public cancelDrawing(): void {
    this.chartstate.isDrawing = false;
    this.chartstate.hasFirstPoint = false;
    this.chartstate.drawingStartPoint = null;
    // this.stopAllHintBlinks();
    this.unlockChartInteraction();

    if (this.chartstate.previewSeries) {
      try {
        this.chartstate.chart.removeSeries(this.chartstate.previewSeries);
      } catch {}
      this.chartstate.previewSeries = null;
    }
  }
   private unlockChartInteraction(): void {
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
  // ==================== UNDO ====================

  /** Pushes a deep-cloned snapshot of both line arrays onto the undo stack, trimming the oldest entry once MAX_UNDO is exceeded. Should be called immediately before any mutating action. */
  public pushUndo(): void {
    this.chartstate.undoStack.push({
      newDrawLine: structuredClone(this.chartstate.newDrawLine),
    });
    if (this.chartstate.undoStack.length > this.chartstate.MAX_UNDO) this.chartstate.undoStack.shift();
  }

  /** Pops the most recent undo snapshot and restores both line arrays from it, clearing selection/handles and re-rendering. No-op (with a toast) if the undo stack is empty. */
public async undoLastChange(): Promise<void> {
  const snapshot = this.chartstate.undoStack.pop();

  if (!snapshot) {
    this.toast.info('Nothing to undo.');
    return;
  }

  // Remove existing lines for this chart/task FIRST
  await this.localdb.deleteLinesByChartAndTask(
    this.chartstate.chartId,
    this.chartstate.taskId
  );

  // Re-save the restored snapshot, capturing fresh DB ids
  const restoredLines = [];
  for (const line of snapshot.newDrawLine) {
    const saved = await this.localdb.createAnswer({
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
    });

    restoredLines.push({
      ...line,
      localDbId: saved.id, // ← reassign to the NEW row's id, not the stale one
    });
  }

  this.chartstate.newDrawLine = restoredLines;
  this.chartstate.selectedLineId = null;
  this.clearHandles();

  const jsonToCandle = this.injector.get(JsonToCandleUsecase);
  jsonToCandle.renderLines();

  this.toast.info('↩ Undo successful.');
}
}