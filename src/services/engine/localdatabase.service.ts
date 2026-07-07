import { Injectable } from '@angular/core';
import { Answers, ChartDB } from '../../app/Components/chart/model/chart.model';
import { IDBPDatabase, openDB } from 'idb';


@Injectable({ providedIn: 'root' })
export class LocalDatabaseService {
  private db!: IDBPDatabase<ChartDB>;

  async init(): Promise<void> {
    this.db = await openDB<ChartDB>('ChartDatabase', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('answerChart')) {
          db.createObjectStore('answerChart', { keyPath: 'id', autoIncrement: true });
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
}