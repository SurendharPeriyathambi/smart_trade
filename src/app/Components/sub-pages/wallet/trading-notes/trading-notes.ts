import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TradingPaymentUsecase } from './usecase/trading_payment.usecase';
import { PaymentHistory } from '../models/wallet.model';
import { TradingPaymentRepository } from './repository/trading_payment.repository';
import { TradingPaymentRepositoryImpl } from './repository/trading_payment.repository.impl';
import { LoaderService } from '../../../../../services/engine/loader.service';
import { finalize } from 'rxjs';
import { ToastService } from '../../../../../services/engine/toast.service';

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
export class TradingNotes implements OnChanges {
 
 @Input() walletId: number | null =null;
 
  // ngOnInit(): void {
  //   this.loadHistory()
  // }
 
 
ngOnChanges(changes: SimpleChanges) {
  if (changes['walletId'] && this.walletId != null) {
    console.log('wallet id:', this.walletId);
    this.loadHistory();
  }
}


private usecase = inject(TradingPaymentUsecase);

 tradinghistory: PaymentHistory []=[];
 private loader = inject(LoaderService);
  private toast = inject(ToastService);
  totalRecords = 0;
totalPages = 0;
currentPage = 1;
pageSize = 10;
loadHistory(page:number=1){
  this.loader.show();
  if (this.walletId == null) {
    // console.log("wallet id :",this.walletId)
    return;
  }

  this.usecase.getAll(this.walletId,page) .pipe(
      finalize(() => this.loader.hide())
    ).subscribe({
    next:(res)=>{
      if (res) {
        console.log('API Response:', res);
  console.log('Data:', res.data);
       
     
        this.toast.success(res.message);
       this.tradinghistory = res.data.data_list;
       console.log('NewData:', this.tradinghistory);
this.currentPage = res.data.current_page;
this.totalRecords = res.data.total_records;

// If your API doesn't return totalPages, calculate it
this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        
      }
    },error(err){
      console.log(err.message)
      
    }
  }) 
}

  goToPage(page: number): void {
  if (page < 1 || page > this.totalPages || page === this.currentPage) return;
  this.loadHistory(page);
}

prevPage(): void {
  this.goToPage(this.currentPage - 1);
}

nextPage(): void {
  this.goToPage(this.currentPage + 1);
}

get pageNumbers(): (number | string)[] {
  const total = this.totalPages;
  const current = this.currentPage;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (current > 4) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 3) pages.push('...');
  pages.push(total);

  return pages;
}
}
