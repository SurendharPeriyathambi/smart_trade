import { Component } from '@angular/core';
import { WalletSummary } from "./wallet-summary/wallet-summary";
import { DepositCard } from "./deposit-card/deposit-card";
import { WithdrawCard } from "./withdraw-card/withdraw-card";
import { TradingNotes } from "./trading-notes/trading-notes";
import { TradeHistory } from "./trade-history/trade-history";
import { AboutUs } from "../../main-pages/about-us/about-us";

@Component({
  selector: 'app-wallet',
  imports: [WalletSummary, DepositCard, WithdrawCard, TradingNotes, TradeHistory, AboutUs],
  templateUrl: './wallet.html',
  styleUrl: './wallet.scss',
})
export class Wallet {

    showDepositModal = false;

  showWithdrawModal = false;

  openDepositModal(): void {
    console.log("deposite is clicked")
    this.showDepositModal = true;
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
  }

  openWithdrawModal(): void {
    this.showWithdrawModal = true;
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
  }
}
