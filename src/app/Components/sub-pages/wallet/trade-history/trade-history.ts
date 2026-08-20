import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TradeCreation, TradeHistoryList, TradeUpdate, WalletCreatation } from '../models/wallet.model';
import { TradeHistoryUsecase } from './usecase/trade-history.usecase';
import { ToastService } from '../../../../../services/engine/toast.service';
import { TradeHistoryRepository } from './repository/trade-history.Repository';
import { TradeHistoryRepositoryImpl } from './repository/trade-history.Repository.impl';
import { StorageEngine } from '../../../../../services/engine/storage_engine';
import { finalize } from 'rxjs';
import { LoaderService } from '../../../../../services/engine/loader.service';
import { TradingNotes } from '../trading-notes/trading-notes';

// Row shown in table = API model + local edit-state, nothing else
export interface TradeRow extends TradeHistoryList {
  isEditing?: boolean;
  backup?: TradeRow;
}

@Component({
  selector: 'app-trade-history',
  imports: [CommonModule, FormsModule],
  templateUrl: './trade-history.html',
  styleUrl: './trade-history.scss',
  providers: [
    TradeHistoryUsecase,
    { provide: TradeHistoryRepository, useClass: TradeHistoryRepositoryImpl },
  ],
})
export class TradeHistory implements OnInit,OnChanges{
 


@Input() walletCreated = false;
@Input() walletId: number | null = null;
@Input() walletCreateDate: string | null = null;

  private usecase = inject(TradeHistoryUsecase);
  private toast = inject(ToastService);
  private loader=inject(LoaderService)
  private cdr = inject(ChangeDetectorRef)
 

  search = '';
  status = '';
  wallet_Id!: number; // set only after wallet loads

  totalRecords = 0;
totalPages = 0;
currentPage = 1;
  trades: TradeRow[] = [];
  showTradeModal = false;
isSavingTrade = false;
  newTrade: TradeCreation = this.emptyTrade();

  ngOnInit(): void {
    // this.loadWallet();
    // 
  }
   ngOnChanges(changes: SimpleChanges): void {
    if (changes['walletId'] && this.walletId != null) {
    console.log('wallet id:', this.walletId);
   this.loadTrades();
  }
    if (changes['walletCreateDate'] && this.walletCreateDate != null) {
    console.log('wallet walletCreateDate:', this.walletCreateDate);
  //  this.loadTrades();
  }

  }

  // yyyy-MM-dd required by <input type="date">
  private toDateInputValue(d: string | Date): string {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Bind this to [attr.min] on the date input
  get minTradeDate(): string {
    return this.walletCreateDate? this.toDateInputValue(this.walletCreateDate) : '';
  }

  openAddTrade(event: MouseEvent): void {

  

   if (!this.walletCreated  || this.walletId == null) {
    this.toast.error('Please create a wallet first.');
    return;
  }
    event.stopPropagation();
    this.newTrade.wallet_id = this.walletId;
    this.showTradeModal = true;
  }

  @ViewChild('tradingNotes') tradingNotesComp?: TradingNotes;


  saveTrade(): void {

    if (!this.walletId) {
    this.toast.error('Wallet not loaded yet');
    return;
  }

  this.newTrade.wallet_id = this.walletId; 
 
    if (!this.newTrade.date) {
      this.toast.error('Please select a trade date');
      return;
    }

    if (this.minTradeDate && this.newTrade.date < this.minTradeDate) {
      this.toast.error(`Trade date can't be before wallet creation date (${this.minTradeDate})`);
      return;
    }
    this.isSavingTrade = true;
    this.loader.show()
    this.usecase.tradeCreate(this.newTrade).pipe( finalize(() =>{ this.loader.hide(); this.isSavingTrade = false;})).subscribe({
      next: (res) => {
        this.toast.show(res.message);
       
        this.resetForm();
        this.loadTrades(this.currentPage);
        this.tradingNotesComp?.loadHistory(1);
         this.closeTradeModal();
         this.cdr.detectChanges()
        
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.message || 'Failed to create trade');
         this.cdr.detectChanges()
      },
    });
  }

  // ...rest unchanged

  editTrade(trade: TradeRow): void {
    trade.backup = structuredClone(trade);
    trade.isEditing = true;
  }




loadTrades(page: number=1): void {
  this.loader.show()
   if (this.walletId == null) {
    console.log("wallet id :",this.walletId)
    return;
  }
  this.usecase.getTradeLists(this.walletId,page).pipe( finalize(() => this.loader.hide())).subscribe({
    next: (res) => {
     this.trades = (res.data.data_list ?? []).map((t: TradeHistoryList) => ({
  ...t,
  isEditing: false,
}));

      this.currentPage = res.data.current_page;
this.totalRecords = res.data.total_records;
this.totalPages = Math.ceil(this.totalRecords / 5);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error(err);
      this.toast.error(err.message || 'Failed to load trades');
    },
  });
}
   closeTradeModal(): void {
    this.showTradeModal = false;
  }
  saveEdit(trade: TradeRow): void {

    if (this.walletId == null) {
  this.toast.error('Wallet not found.');
  return;
}
    const { isEditing, backup, ...rest } = trade;
 const payload: TradeUpdate = {
    ...rest,
    wallet_id: this.walletId,
   // or trade.lot_size if you add it to TradeHistoryList later
  };
  this.loader.show()
    this.usecase.updateTrade(payload).pipe( finalize(() => this.loader.hide())).subscribe({
      next: (res) => {
        this.toast.show(res.message);
        trade.isEditing = false;
        this.cdr.detectChanges()
        trade.backup = undefined;
      },
      error: (err) => {
        console.error(err);
        this.toast.error(err.message || 'Failed to update trade');
         this.cdr.detectChanges()
        this.cancelEdit(trade);
      },
    });
  }

  cancelEdit(trade: TradeRow): void {
    if (trade.backup) {
      Object.assign(trade, trade.backup);
    }
    trade.backup = undefined;
    trade.isEditing = false;
  }

  deleteTrade(trade: TradeRow): void {
    this.loader.show()
    this.usecase.deleteTrade(trade.id).pipe( finalize(() => this.loader.hide())).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.trades = this.trades.filter(t => t.id !== trade.id);
        const isLastItemOnPage = this.trades.length === 1 && this.currentPage > 1;
  this.loadTrades(isLastItemOnPage ? this.currentPage - 1 : this.currentPage);
      },
      error: (err) => {
        console.error(err);
       
        this.toast.error(err.message || 'Failed to delete trade');
      },
    });
  }

  // Generic so it works for both the Add-Trade form (TradeCreation)
  // and an in-row edit (TradeRow). Direction check is case-insensitive
  // since the modal uses 'Buy'/'Sell' and the table uses 'BUY'/'SELL'.
  calculateTrade<T extends {
    direction: string;
    entry_price: number;
    exit_price: number;
    stop_loss: number;
    take_profit: number;
    points_captured: number;
    risk_reward: number;
  }>(trade: T): void {
    trade.points_captured = trade.exit_price - trade.entry_price;

    let ratio = 0;
    const direction = trade.direction?.toUpperCase();

    if (direction === 'BUY') {
      ratio = (trade.take_profit - trade.entry_price) / (trade.entry_price - trade.stop_loss);
    } else {
      ratio = (trade.entry_price - trade.take_profit) / (trade.stop_loss - trade.entry_price);
    }

    trade.risk_reward = ratio > 0 ? Number(ratio.toFixed(2)) : 0;
  }

  private resetForm(): void {
    this.newTrade = this.emptyTrade();
  }

  private emptyTrade(): TradeCreation {
    return {
    wallet_id: 0, date: '', pair: '', lot_size: 1, direction: 'Buy',
      entry_price: 0, stop_loss: 0, take_profit: 0, exit_price: 0,
      points_captured: 0, win_loss: 'Win', risk_reward: 0,
      profit: 0, loss: 0, reason: '', remark: '',
    };
  }



  goToPage(page: number): void {
  if (page < 1 || page > this.totalPages || page === this.currentPage) return;
  this.loadTrades(page);
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


// remove selectAll(), replace with:
clearZero(event: FocusEvent): void {
  const input = event.target as HTMLInputElement;
  if (input.value === '0') {
    input.value = '';
  }
}
}