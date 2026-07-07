import { Injectable } from '@angular/core';
import { ChartState } from '../state/chart.state';
import { JsonToCandleUsecase } from './jsonTocandle.usecase';
import { ExtendUsecase } from './extend.usecase';

import { uuidv4 } from './drawline.usecase';
import { Answers } from '../model/chart.model';
import { LocalDatabaseService } from '../../../../services/engine/localdatabase.service';
import { ToastService } from '../../../../services/engine/toast.service';

@Injectable({ providedIn: 'root' })
export class DuplicateUsecase {
  constructor(
    private chartState: ChartState,
    private candle: JsonToCandleUsecase,
    private extend: ExtendUsecase,
    private localdb: LocalDatabaseService,
    private toast: ToastService,
  ) {}

  /** Duplicates the selected line. Original stays in newDrawLine untouched — only push, never splice/remove. */
 async duplicateSelectedLine(): Promise<void> {
  if (!this.chartState.selectedLineId) {
    this.toast.info('Select a line first');
    return;
  }
  const original = this.chartState.findLine(this.chartState.selectedLineId);
  if (!original) return;

  let priceOffset = 0;
  if (this.chartState.chartData.length) {
    const prices = this.chartState.chartData.flatMap((d: any) => [d.high, d.low]);
    priceOffset = -((Math.max(...prices) - Math.min(...prices)) * 0.03);
  }

  const duplicate: Answers = {
    ...structuredClone(original),
    id: uuidv4(),
    localDbId: null,
    answer_id: null,
    start_price: original.start_price + priceOffset,
    end_price: original.end_price + priceOffset,
    is_edit: false,
  };

  this.chartState.newDrawLine.push(duplicate);

  const saved = await this.localdb.createAnswer({
    answer_id: null,
    chart_id: this.chartState.chartId,
    task_id: this.chartState.taskId,
    start_price: duplicate.start_price,
    end_price: duplicate.end_price,
    start_time: duplicate.start_time,
    end_time: duplicate.end_time,
    start_x: 0, end_x: 0, start_y: 0, end_y: 0,
    is_edit: false,
    is_delete: false,
  } as Answers);

  duplicate.localDbId = saved.id;

  this.chartState.selectedLineId = duplicate.id;
  this.candle.renderLines();
  this.toast.success('Line duplicated');
}

async duplicateAndExtendManually(): Promise<void> {
  if (!this.chartState.selectedLineId) {
    this.toast.info('Select a line first to extend.');
    return;
  }
  await this.duplicateSelectedLine();
  setTimeout(() => {
    if (this.chartState.selectedLineId) this.extend.showExtensionControls();
  }, 300);
}


}