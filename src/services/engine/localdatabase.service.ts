import { Injectable } from '@angular/core';
import { Answers, ChartDB } from '../../app/Components/chart/model/chart.model';
import { IDBPDatabase, openDB } from 'idb';
import { ChartState } from '../../app/Components/chart/state/chart.state';


@Injectable({ providedIn: 'root' })
export class LocalDatabaseService {
  private db!: IDBPDatabase<ChartDB>;

 async init(): Promise<void> {
  this.db = await openDB<ChartDB>('ChartDatabase', 2, {
    upgrade(db) {

      if (!db.objectStoreNames.contains('answerChart')) {
        db.createObjectStore('answerChart', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains('userChart')) {
        db.createObjectStore('userChart', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

    },
  });
}
  async createAnswer(answer: Answers): Promise<Answers & { id: number }> {
  const id = await this.db.add('answerChart', answer) as number;
  return { ...answer, id };
}

  async updateAnswer(id: number, answer: Answers): Promise<void> {
    await this.db.put('answerChart', { ...answer, id });
  }

  async getAnswer(): Promise<Answers[]> {
    return await this.db.getAll('answerChart');
  }

  async getAnswerById(id: number): Promise<Answers | undefined> {
    return await this.db.get('answerChart', id);
  }

  async getByChartAndTask(chartId: number, taskId: number): Promise<Answers[]> {
    const all = await this.getAnswer();
    return all.filter(a => a.chart_id === chartId && a.task_id === taskId);
  }

  async deleteAnswer(id: number): Promise<void> {
    await this.db.delete('answerChart', id);
  }

  async clearAll(): Promise<void> {
    await this.db.clear('answerChart');
  }
  async deleteLinesByChartAndTask(chartId: number, taskId: number): Promise<void> {
  const tx = this.db.transaction('answerChart', 'readwrite');
  const store = tx.objectStore('answerChart');

  const allAnswers = await store.getAll();

  for (const answer of allAnswers) {
    if (answer.chart_id === chartId && answer.task_id === taskId && answer.id) {
      await store.delete(answer.id);
    }
  }

  await tx.done;
}
async createUserAnswer(answer: any): Promise<Answers & { id: number }> {

  const id = await this.db.add('userChart', answer) as number;

  return {
    ...answer,
    id,
  };
}
async getUserAnswers(): Promise<Answers[]> {
  return await this.db.getAll('userChart');
}
async getUserByChartAndTask(
  chartId: number,
  taskId: number
): Promise<Answers[]> {

  const all = await this.getUserAnswers();

  return all.filter(
    x =>
      x.chart_id === chartId &&
      x.task_id === taskId
  );
}
async validateUserLine(userLine: Answers): Promise<boolean> {

  const adminLines =
    await this.getByChartAndTask(
      userLine.chart_id!,
      userLine.task_id!
    );

  for (const admin of adminLines) {

    const matched =

      Math.abs(admin.start_time - userLine.start_time) <= 5 &&

      Math.abs(admin.end_time - userLine.end_time) <= 5 &&

      Math.abs(admin.start_price - userLine.start_price) <= 0.5 &&

      Math.abs(admin.end_price - userLine.end_price) <= 0.5;

    if (matched) {

      await this.createUserAnswer({
        ...userLine,
      });

      return true;
    }
  }

  await this.createUserAnswer(userLine);

  return false;
}

async deleteUserLinesByChartAndTask(chartId: number, taskId: number): Promise<void> {
  const tx = this.db.transaction('userChart', 'readwrite');
  const store = tx.objectStore('userChart');
  const all = await store.getAll();
  for (const row of all) {
    if (row.chart_id === chartId && row.task_id === taskId && row.id) {
      await store.delete(row.id);
    }
  }
  await tx.done;
}

async saveAdminLines(chartId: number, taskId: number, lines: Answers[]): Promise<void> {
  // Clear stale admin rows for this chart/task first — avoids duplicate
  // answerChart rows piling up across sessions (same bug class as before).
  await this.deleteLinesByChartAndTask(chartId, taskId);
  const tx = this.db.transaction('answerChart', 'readwrite');
  const store = tx.objectStore('answerChart');
  for (const line of lines) {
    await store.add({ ...line, chart_id: chartId, task_id: taskId });
  }
  await tx.done;
}

/**
 * Read-only comparison against IndexedDB. Does NOT mutate userChart —
 * unlike the old validateUserLine(), which inserted a duplicate userChart
 * row on every single call (match or not). Returns a map of userLine.id -> matched.
 */
async validateLinesAgainstDb(
  chartId: number,
  taskId: number
): Promise<Map<number, boolean>> {

  const adminLines = await this.getByChartAndTask(chartId, taskId);
  const userLines = await this.getUserByChartAndTask(chartId, taskId);

  const results = new Map<number, boolean>();

  const TIME_TOLERANCE = 5;

  for (const user of userLines) {
    let matched = false;

    for (const admin of adminLines) {

      // Tolerance scales with the admin line's own price range,
      // so it works regardless of instrument (forex, stock, index).
      const priceSpan = Math.abs(admin.end_price - admin.start_price) || 1;
      const PRICE_TOLERANCE = priceSpan * 0.02; // 2% of the line's price span

      const startOk =
        Math.abs(admin.start_time - user.start_time) <= TIME_TOLERANCE &&
        Math.abs(admin.start_price - user.start_price) <= PRICE_TOLERANCE;

      const endOk =
        Math.abs(admin.end_time - user.end_time) <= TIME_TOLERANCE &&
        Math.abs(admin.end_price - user.end_price) <= PRICE_TOLERANCE;

      if (startOk && endOk) {
        matched = true;
        break;
      }
    }

    results.set(user.id!, matched);
  }

  return results;
}
}