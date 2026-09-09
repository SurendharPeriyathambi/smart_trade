import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-withdraw-card',
  imports: [FormsModule,CommonModule],
  templateUrl: './withdraw-card.html',
  styleUrl: './withdraw-card.scss',
})
export class WithdrawCard {
 @Input() availableBalance = 0;

  @Output()
  withdraw = new EventEmitter<number>();

  amount: number | null = null;

  get hasInsufficientBalance(): boolean {

    return !!this.amount && this.amount > this.availableBalance;

  }

  submit(): void {

    if (!this.amount || this.amount <= 0) {
      return;
    }

    if (this.hasInsufficientBalance) {
      return;
    }

    this.withdraw.emit(this.amount);

    this.amount = null;

  }
}
