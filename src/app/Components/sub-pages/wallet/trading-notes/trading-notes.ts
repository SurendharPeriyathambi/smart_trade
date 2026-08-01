import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TradingPaymentUsecase } from './usecase/trading_payment.usecase';
import { PaymentHistory } from '../models/wallet.model';
import { TradingPaymentRepository } from './repository/trading_payment.repository';
import { TradingPaymentRepositoryImpl } from './repository/trading_payment.repository.impl';

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
    providers: [
      TradingPaymentUsecase,
    {
      provide: TradingPaymentRepository,
      useClass: TradingPaymentRepositoryImpl
    }
  ]
})
export class TradingNotes implements OnInit {
  ngOnInit(): void {
    this.loadHistory()
  }
 
 
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


private usecase = inject(TradingPaymentUsecase);

 tradinghistory: PaymentHistory []=[];

loadHistory(){
  this.usecase.getAll().subscribe({
    next:(res)=>{
      if (res) {
        this.tradinghistory = res.data;
        console.log(this.tradinghistory)
      }
    },error(err){
      console.log(err.message)
    }
  }) 
}

}
