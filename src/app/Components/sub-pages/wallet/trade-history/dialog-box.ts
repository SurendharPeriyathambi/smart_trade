import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-cancel-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="open" (click)="onNo()">
      <div class="sheet" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="onNo()" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

        <h2 class="title">{{ title }}</h2>
        <p class="body">{{ message }}</p>

        <button class="btn btn-primary" (click)="onYes()">{{ confirmLabel }}</button>
        <button class="btn btn-secondary" (click)="onNo()">{{ cancelLabel }}</button>

        <div class="home-indicator"></div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 15, 15, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }

    .sheet {
      position: relative;
      width: 100%;
      max-width: 360px;
      background: #ffffff;
      border-radius: 24px;
      padding: 32px 28px 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #F3F4F6;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .close-btn:hover { background: #E5E7EB; }

    .title {
      margin: 0 0 12px;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }

    .body {
      margin: 0 0 28px;
      font-size: 14px;
      line-height: 1.5;
      color: #9CA3AF;
    }

    .btn {
      width: 100%;
      padding: 15px 0;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 12px;
    }

    .btn-primary {
      background: #3B5BFD;
      color: #ffffff;
      border: none;
    }
    .btn-primary:hover { background: #2E4AE0; }

    .btn-secondary {
      background: #ffffff;
      color: #3B5BFD;
      border: 1.5px solid #C7D2FE;
    }
    .btn-secondary:hover { background: #F5F7FF; }

    .home-indicator {
      width: 120px;
      height: 4px;
      background: #111827;
      border-radius: 2px;
      margin: 8px auto 0;
    }
  `]
})
export class ConfirmCancelDialogComponent<T = any> {
  @Input() open = false;
  @Input() title = 'Are you sure?';
  @Input() message =
    "If you cancel now, your link will stop working and you won't be able to receive payments.";
  @Input() confirmLabel = 'Yes, cancel';
  @Input() cancelLabel = 'No';

  /** Arbitrary payload for the item this dialog is acting on (e.g. the row/id to delete). */
  @Input() data: T | null = null;

  /** Emits the same data back so the caller knows what was confirmed/dismissed. */
  @Output() confirmed = new EventEmitter<T | null>();
  @Output() dismissed = new EventEmitter<T | null>();

  onYes(): void {
    this.confirmed.emit(this.data);
  }

  onNo(): void {
    this.dismissed.emit(this.data);
  }
}