import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wallet-summary',
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet-summary.html',
  styleUrl: './wallet-summary.scss',
})
export class WalletSummary {
  hasTrade = input<boolean>(false);
  constructor(private router: Router) {}

  @Input() walletCreated = false;

  // allow null | undefined — don't force a required number input
  @Input() walletId: number | null = null;

  @Input() currentBalance: any;
  @Input() walletDate: any;
  date = new Date();
  @Input() totalDeposit = 15000;
  @Input() totalWithdraw = 2500;
  @Input() netProfit = 1000;
  @Input() totalTrades = 28;
  @Input() monthlyGrowth = 8.52;

  @Output() createWalletClick = new EventEmitter<void>();
  @Output() depositClick = new EventEmitter<void>();
  @Output() withdrawClick = new EventEmitter<void>();
  @Output() journalClick = new EventEmitter<void>();

  openCreateWallet(): void {
    this.createWalletClick.emit();
  }

  openDeposit(): void {
    this.depositClick.emit();
  }

  openWithdraw(): void {
    this.withdrawClick.emit();
  }

  goToJournal(): void {
    console.log('walletId at click time:', this.walletId, typeof this.walletId);

    // catches both null and undefined
    if (this.walletId == null) {
      console.error('Wallet ID is missing');
      return;
    }

    this.router.navigate(['/journal', this.walletId]);
  }
}