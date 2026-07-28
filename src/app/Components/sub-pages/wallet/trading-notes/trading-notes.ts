import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface WalletTransaction {

  id: number;

  date: string;

  action: 'Deposit' | 'Withdraw';

  amount: number;

  closingBalance: number;

}

@Component({
  selector: 'app-trading-notes',
  imports: [FormsModule,CommonModule],
  templateUrl: './trading-notes.html',
  styleUrl: './trading-notes.scss',
})
export class TradingNotes {
 
 
  transactions: WalletTransaction[] = [

  {
    id: 1,
    date: '28 Jul 2026',
    action: 'Deposit',
    amount: 5000,
    closingBalance: 25000
  },

  {
    id: 2,
    date: '27 Jul 2026',
    action: 'Withdraw',
    amount: 2000,
    closingBalance: 20000
  },

  {
    id: 3,
    date: '25 Jul 2026',
    action: 'Deposit',
    amount: 10000,
    closingBalance: 22000
  },

  {
    id: 4,
    date: '22 Jul 2026',
    action: 'Withdraw',
    amount: 1500,
    closingBalance: 12000
  }

];
}
