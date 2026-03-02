import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';


@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toastService.toast()) {
    <div class="toast-wrapper">
      @for (toast of toastService.toast(); track toast.id) {
        <div class="toast-container" [ngClass]="toast.type">
          
          <span class="toast-icon">
            {{ getIcon(toast.type) }}
          </span>

          <span class="toast-message">
            {{ toast.message }}
          </span>

          <button class="close-btn"
                  (click)="toastService.remove(toast.id)">
            ✖
          </button>

        </div>
      }
    </div>

    }
  `,
  styles: [`
 .toast-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  width: 100vw;   /* full viewport */
  height: 100vh;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 20px;
  z-index: 2147483647; /* max safe value */
  pointer-events: none;
}

.toast-container {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  min-width: 340px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #111827;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  animation: slideIn 0.35s ease;
}
.toast-icon {
  font-size: 16px;
}

/* Professional Accent Border Instead of Full Background */

.success {
  border-left: 5px solid #16a34a;
}

.error {
  border-left: 5px solid #dc2626;
}

.warning {
  border-left: 5px solid #d97706;
}

.info {
  border-left: 5px solid #2563eb;
}

.close-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #d1d5db;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}

.close-btn:hover {
  color: white;
}

/* Animation */

@keyframes slideIn {
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);


  getIcon(type: string) {
    switch(type) {
      case 'success': return '✔';
      case 'error': return '✖';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }}
}