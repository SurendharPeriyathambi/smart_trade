import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-deposit-card',
  imports: [FormsModule,CommonModule],
  templateUrl: './deposit-card.html',
  styleUrl: './deposit-card.scss',
})
export class DepositCard {
  amount: number | null = null;

  @Output()
  deposit = new EventEmitter<number>();

  submit() {

    if (!this.amount || this.amount <= 0) {
      return;
    }

    this.deposit.emit(this.amount);

    this.amount = null;

  }

}
