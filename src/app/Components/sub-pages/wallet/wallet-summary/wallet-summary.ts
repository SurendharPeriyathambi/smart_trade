import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DepositCard } from "../deposit-card/deposit-card";
import { WithdrawCard } from "../withdraw-card/withdraw-card";

@Component({
  selector: 'app-wallet-summary',
  imports: [CommonModule, ],
  templateUrl: './wallet-summary.html',
  styleUrl: './wallet-summary.scss',
})
export class WalletSummary {

  @Input() currentBalance = 12500;
  @Input() totalDeposit = 15000;
  @Input() totalWithdraw = 2500;
  @Input() netProfit = 1000;
  @Input() totalTrades = 28;
  @Input() monthlyGrowth = 8.52;

  showDepositModal = false;
showWithdrawModal = false;

@Output() depositClick = new EventEmitter<void>();

@Output() withdrawClick = new EventEmitter<void>();

openDeposit() {
  this.depositClick.emit();
}

openWithdraw() {
  this.withdrawClick.emit();
}

openWithdrawModal() {
  this.showWithdrawModal = true;
}

closeWithdrawModal() {
  this.showWithdrawModal = false;
}
}
