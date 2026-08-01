import { Component, Inject, inject } from '@angular/core';
import { WalletSummary } from "./wallet-summary/wallet-summary";
import { DepositCard } from "./deposit-card/deposit-card";
import { WithdrawCard } from "./withdraw-card/withdraw-card";
import { TradingNotes } from "./trading-notes/trading-notes";
import { TradeHistory } from "./trade-history/trade-history";
import { AboutUs } from "../../main-pages/about-us/about-us";
import { FormsModule } from '@angular/forms';
import { WalletUsecase } from './usecase/wallet.usecase';
import { WalletCreatation } from './models/wallet.model';
import { WalletRepository } from './repository/wallet.repository';
import { WalletRepositoryImpl } from './repository/wallet.repository.impl';
import { ToastService } from '../../../../services/engine/toast.service';
import { LoaderService } from '../../../../services/engine/loader.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';

export interface WalletCreatePayload {
  date: string;
  depositNow: boolean;
  amount: number | null;
}

@Component({
  selector: 'app-wallet',
  imports: [WalletSummary, DepositCard, WithdrawCard, TradingNotes, TradeHistory, AboutUs, FormsModule],
  templateUrl: './wallet.html',
  styleUrl: './wallet.scss',
    providers: [
     WalletUsecase,
      {
        provide: WalletRepository,
        useClass: WalletRepositoryImpl,
      },
    ],
})
export class Wallet {

  private usecase = inject (WalletUsecase);
  private toast  = inject(ToastService);
  private loader =inject(LoaderService);
  private storage = inject(StorageEngine)
  private currentUserId = 5;

  // whether a wallet exists yet — drives WalletSummary's empty vs full state
  walletCreated = false;
   currentBalance = 0;


  showDepositModal = false;
  showWithdrawModal = false;
  showCreateWalletModal = false;
   isSubmitting = false;
  submitError = '';
  // create-wallet form state
  walletDate = '';
  depositNow = false;
  depositAmount: number | null = null;
  maxDate = new Date().toISOString().split('T')[0];
  dateError ='';

  // ---------- Deposit modal ----------

  openDepositModal(): void {
    this.showDepositModal = true;
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
  }

  // ---------- Withdraw modal ----------

  openWithdrawModal(): void {
    this.showWithdrawModal = true;
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
  }

  // ---------- Create Wallet modal ----------

  openCreateWalletModal(): void {
    this.showCreateWalletModal = true;
  }

  closeCreateWalletModal(): void {
    this.showCreateWalletModal = false;
    this.resetCreateWalletForm();
  }

  // reset deposit fields whenever the date changes, so we never
  // submit an amount tied to a date the user has since changed
  onWalletDateChange(): void {
    this.depositNow = false;
    this.depositAmount = null;
    this.dateError='';
    if(this.walletDate && this.walletDate > this.maxDate){
       this.dateError = 'Future dates are not allowed.';
      this.walletDate = '';
    }
  }


  
 createWallet(): void {

  this.loader.show();
  if (!this.walletDate || this.walletDate > this.maxDate) {
    this.dateError = 'Please choose today\'s date or an earlier one.';
    return;
  }

  const payload: WalletCreatation = {
    user_id: this.currentUserId,
    wallet_create_date:this.formatDateForApi( this.walletDate),
    amount: this.depositNow ? (this.depositAmount ?? 0) : 0
  };

  this.isSubmitting = true;
  this.submitError = '';

  this.usecase.execute(payload).subscribe({
    next: (res) => {
      this.isSubmitting = false;

      if (res.status) {
        this.walletCreated = true;
        this.currentBalance = res.data.amount;
       if (res.data.id != null) {
  this.storage.setWalletId(res.data.id);
}
        this.showCreateWalletModal = false;
        this.resetCreateWalletForm();
        this.toast.success(res.message);
        this.loader.hide()
      } else {
        this.submitError = res.message || 'Failed to create wallet.';
      }
    },
    error: (err) => {
      this.isSubmitting = false;
     this.toast.error(err?.error?.message || 'Something went wrong. Please try again.');
 this.loader.hide()
     
    }
  });
}
  private resetCreateWalletForm(): void {
  this.walletDate = '';
  this.depositNow = false;
  this.depositAmount = null;
  this.dateError = '';
  this.submitError = '';
}

private formatDateForApi(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}
}