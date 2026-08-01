import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-wallet-summary',
  imports: [CommonModule],
  templateUrl: './wallet-summary.html',
  styleUrl: './wallet-summary.scss',
})
export class WalletSummary {

  @Input() walletCreated = false;

  @Input() currentBalance = 12500;
  @Input() totalDeposit = 15000;
  @Input() totalWithdraw = 2500;
  @Input() netProfit = 1000;
  @Input() totalTrades = 28;
  @Input() monthlyGrowth = 8.52;

  @Output() createWalletClick = new EventEmitter<void>();
  @Output() depositClick = new EventEmitter<void>();
  @Output() withdrawClick = new EventEmitter<void>();

  openCreateWallet(): void {
    this.createWalletClick.emit();
  }

  openDeposit(): void {
    this.depositClick.emit();
  }

  openWithdraw(): void {
    this.withdrawClick.emit();
  }
}