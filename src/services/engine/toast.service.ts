import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
     duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<Toast  []>([]);
 private counter = 0;
  show(message: string, type:Toast['type']='info', duration: number = 3000) {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, duration };
    this.toast.update(t => [...t, toast]);
     setTimeout(() => this.remove(id), duration);
    
  }
  remove(id: number) {
    this.toast.update(t => t.filter(toast => toast.id !== id));
  }
 
  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string) { this.show(msg, 'error'); }
  warning(msg: string) { this.show(msg, 'warning'); }
  info(msg: string) { this.show(msg, 'info'); }


}