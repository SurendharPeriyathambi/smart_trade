import { ChangeDetectorRef, Component, Inject, inject, OnInit, ViewChild } from '@angular/core';
import { WalletSummary } from './wallet-summary/wallet-summary';
import { DepositCard } from './deposit-card/deposit-card';
import { WithdrawCard } from './withdraw-card/withdraw-card';
import { TradingNotes } from './trading-notes/trading-notes';
import { TradeHistory } from './trade-history/trade-history';
import { AboutUs } from '../../main-pages/about-us/about-us';
import { FormsModule } from '@angular/forms';
import { WalletUsecase } from './usecase/wallet.usecase';
import {
  WalletCreatation,
  WalletCreatationRes,
  WalletTransactionRequest,
} from './models/wallet.model';
import { WalletRepository } from './repository/wallet.repository';
import { WalletRepositoryImpl } from './repository/wallet.repository.impl';
import { ToastService } from '../../../../services/engine/toast.service';
import { LoaderService } from '../../../../services/engine/loader.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { finalize } from 'rxjs/operators';
import { WalletJournalModal } from '../wallet-journal-modal/wallet-journal-modal';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";

export interface WalletCreatePayload {
  date: string;
  depositNow: boolean;
  amount: number | null;
}

@Component({
  selector: 'app-wallet',
  imports: [
    WalletSummary,
    DepositCard,
    WithdrawCard,
    TradingNotes,
    TradeHistory,
    AboutUs,
    FormsModule,
    WalletJournalModal,
    Header,
    Footer
],
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
export class Wallet implements OnInit {
  private usecase = inject(WalletUsecase);
  private toast = inject(ToastService);
  private loader = inject(LoaderService);
  private cdr = inject(ChangeDetectorRef);
  private storage = inject(StorageEngine);
  private currentUserId = Number(this.storage.getId());

  // reference to the child so we can refresh payment history after deposit/withdraw
  @ViewChild('tradingNotes') tradingNotesComp?: TradingNotes;

  // whether a wallet exists yet — drives WalletSummary's empty vs full state
  walletCreated = false;
  currentBalance = 0;

  wallet!: WalletCreatationRes;

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
  dateError = '';

  // ---------- Deposit modal form state ----------
  depositTxnAmount: number | null = null;
  isDepositSubmitting = false;
  depositError = '';

  // ---------- Withdraw modal form state ----------
  withdrawTxnAmount: number | null = null;
  isWithdrawSubmitting = false;
  withdrawError = '';

  // add near other deposit modal state
  depositTxnDate = '';

  //model
  showJournalModal = false;

  // getter — min allowed date is the wallet's creation date
  get minDepositDate(): string {
    return this.wallet?.create_date ? this.toDateInputValue(this.wallet.create_date) : '';
  }

  // yyyy-MM-dd formatter (same one you already use for trades, add if missing here)
  private toDateInputValue(d: string | Date): string {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ---------- Deposit modal ----------

  openDepositModal(): void {
    this.showDepositModal = true;
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
    this.resetDepositForm();
  }

  submitDeposit(): void {
    this.depositError = '';

    if (!this.depositTxnDate) {
      this.depositError = 'Please select a date.';
      return;
    }

    if (this.minDepositDate && this.depositTxnDate < this.minDepositDate) {
      this.depositError = `Date can't be before wallet creation date (${this.minDepositDate})`;
      return;
    }

    if (this.depositTxnDate > this.maxDate) {
      this.depositError = 'Future dates are not allowed.';
      return;
    }

    if (!this.depositTxnAmount || this.depositTxnAmount <= 0) {
      this.depositError = 'Please enter a valid amount.';
      return;
    }

    const payload: WalletTransactionRequest = {
      action: 'deposite',
      amount: this.depositTxnAmount.toFixed(2),
      date: this.depositTxnDate,
    };

    this.isDepositSubmitting = true;
    this.loader.show();

    this.usecase
      .walletaction(payload)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          this.isDepositSubmitting = false;

          if (res.status) {
            this.currentBalance += Number(payload.amount);
            this.toast.success(res.message || 'Deposit successful.');
            this.showDepositModal = false;
            this.resetDepositForm();
            setTimeout(() => {
              this.tradingNotesComp?.loadHistory(1);
            }, 500);

            this.cdr.detectChanges();
          } else {
            this.depositError = res.message || 'Failed to add deposit.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isDepositSubmitting = false;
          this.toast.error(err?.error?.message || 'Something went wrong. Please try again.');
          this.cdr.detectChanges();
        },
      });
  }

  private resetDepositForm(): void {
    this.depositTxnAmount = null;
    this.depositTxnDate = '';
    this.depositError = '';
  }

  // ---------- Withdraw modal ----------

  openWithdrawModal(): void {
    this.showWithdrawModal = true;
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
    this.resetWithdrawForm();
  }

  submitWithdraw(): void {
    this.withdrawError = '';

    if (!this.withdrawTxnAmount || this.withdrawTxnAmount <= 0) {
      this.withdrawError = 'Please enter a valid amount.';
      return;
    }

    if (this.withdrawTxnAmount > this.currentBalance) {
      this.withdrawError = 'Insufficient balance.';
      return;
    }
    console.log(this.withdrawTxnAmount);
    console.log(typeof this.withdrawTxnAmount);

    const payload: WalletTransactionRequest = {
      action: 'withdraw',
      amount: this.withdrawTxnAmount.toFixed(2),
    };

    this.isWithdrawSubmitting = true;
    this.loader.show();

    this.usecase
      .walletaction(payload)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          this.isWithdrawSubmitting = false;

          if (res.status) {
            this.currentBalance -= Number(payload.amount);
            this.toast.success(res.message || 'Withdrawal successful.');
            this.showWithdrawModal = false;
            this.resetWithdrawForm();
            this.tradingNotesComp?.loadHistory(1);
            this.cdr.detectChanges();
          } else {
            this.withdrawError = res.message || 'Failed to withdraw.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isWithdrawSubmitting = false;
          this.toast.error(err?.error?.message || 'Something went wrong. Please try again.');
          this.cdr.detectChanges();
        },
      });
  }

  private resetWithdrawForm(): void {
    this.withdrawTxnAmount = null;
    this.withdrawError = '';
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
    this.dateError = '';
    if (this.walletDate && this.walletDate > this.maxDate) {
      this.dateError = 'Future dates are not allowed.';
      this.walletDate = '';
    }
  }

  createWallet(): void {
    if (!this.walletDate || this.walletDate > this.maxDate) {
      this.dateError = "Please choose today's date or an earlier one.";
      return;
    }

    const payload: WalletCreatation = {
      user_id: this.currentUserId,
      date: this.walletDate,
      amount: this.depositNow ? (this.depositAmount ?? 0) : 0,
    };

    this.isSubmitting = true;
    this.submitError = '';
    this.loader.show();
    this.usecase
      .execute(payload)
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;

          if (res.status) {
            this.walletCreated = true;
            this.currentBalance = res.data.amount;

            if (res.data.id != null) {
              this.storage.setWalletId(res.data.id);
            }
            this.showCreateWalletModal = false;
            this.cdr.detectChanges();
            this.resetCreateWalletForm();
            this.toast.success(res.message);
          } else {
            this.submitError = res.message || 'Failed to create wallet.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toast.error(err?.error?.message || 'Something went wrong. Please try again.');
          this.cdr.detectChanges();
        },
      });
  }
  private resetCreateWalletForm(): void {
    this.walletDate = '';
    this.depositNow = false;
    this.depositAmount = null;
    this.dateError = '';
    this.submitError = '';
  }

  ngOnInit(): void {
    this.loadWallet();
  }

  loadWallet(): void {
    this.loader.show();

    this.usecase
      .getWallet()
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (res) => {
          const data = res.data;
          const hasWallet = res.status && data && !(Array.isArray(data) && data.length === 0);

          if (hasWallet) {
            this.walletCreated = true;
            this.wallet = res.data;
            this.currentBalance = res.data.amount;

            if (res.data.id) {
              this.storage.setWalletId(res.data.id);
            }
          } else {
            this.walletCreated = false;
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          this.walletCreated = false;
          // this.toast.error(err?.error?.message ?? 'Unable to load wallet.');
          this.cdr.detectChanges();
        },
      });
  }

  openJournalModal(): void {
    this.showJournalModal = true;
  }

  closeJournalModal(): void {
    this.showJournalModal = false;
  }

  // goToJournal(): void {
  //   this.router.navigate(['/journal']);
  // }
}
