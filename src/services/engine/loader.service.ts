import { Injectable } from '@angular/core';
import { asyncScheduler, BehaviorSubject, observeOn } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable().pipe(observeOn(asyncScheduler));

  show() { this.loading.next(true); }
  hide() { this.loading.next(false); }
}