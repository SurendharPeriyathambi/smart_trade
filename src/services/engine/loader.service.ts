import { Injectable } from '@angular/core';
import { asyncScheduler, BehaviorSubject, observeOn } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable().pipe(observeOn(asyncScheduler));
 private activeRequests = 0;
  show() { this.loading.next(true);  this.activeRequests++;}
  hide() { 
     this.activeRequests = Math.max(0, this.activeRequests - 1);
     if (this.activeRequests === 0) {
      this.loading.next(false); // only hides when ALL callers are done
    }
   }
}