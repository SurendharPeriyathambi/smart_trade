import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
export interface Trade {

  id: number;

  date: string;

  pair: string;

  direction: 'Buy' | 'Sell';

  entryPrice: number;

  stopLoss: number;

  takeProfit: number;

  exitPrice: number;

  pointsCaptured: number;

  riskReward: string;

  winLoss: 'Win' | 'Loss';

  profit: number;

  loss: number;

  reason: string;
    isEditing?: boolean;

  backup?: Trade;

}
@Component({
  selector: 'app-trade-history',
  imports: [CommonModule,FormsModule],
  templateUrl: './trade-history.html',
  styleUrl: './trade-history.scss',
})
export class TradeHistory {

  search = '';

  status = '';

trades: Trade[] = [
  {
    id: 1,
    date: '28 Jul 2026',
    pair: 'BTC/USDT',
    direction: 'Buy',
    entryPrice: 67250,
    stopLoss: 67000,
    takeProfit: 67800,
    exitPrice: 67720,
    pointsCaptured: 470,
    riskReward: '1 : 2.5',
    winLoss: 'Win',
    profit: 470,
    loss: 0,
    reason: 'Breakout above resistance with strong volume.'
  },
  {
    id: 2,
    date: '27 Jul 2026',
    pair: 'XAU/USD',
    direction: 'Sell',
    entryPrice: 3342.50,
    stopLoss: 3355.00,
    takeProfit: 3320.00,
    exitPrice: 3352.40,
    pointsCaptured: -9.9,
    riskReward: '1 : 1',
    winLoss: 'Loss',
    profit: 0,
    loss: 9.9,
    reason: 'Entered early before confirmation.'
  },
  {
    id: 3,
    date: '26 Jul 2026',
    pair: 'NIFTY',
    direction: 'Buy',
    entryPrice: 25120,
    stopLoss: 25060,
    takeProfit: 25240,
    exitPrice: 25205,
    pointsCaptured: 85,
    riskReward: '1 : 2',
    winLoss: 'Win',
    profit: 85,
    loss: 0,
    reason: 'Morning breakout after consolidation.'
  },
  {
    id: 4,
    date: '25 Jul 2026',
    pair: 'EUR/USD',
    direction: 'Sell',
    entryPrice: 1.1725,
    stopLoss: 1.1750,
    takeProfit: 1.1680,
    exitPrice: 1.1692,
    pointsCaptured: 33,
    riskReward: '1 : 1.8',
    winLoss: 'Win',
    profit: 33,
    loss: 0,
    reason: 'Rejection from daily resistance zone.'
  }
];



showTradeModal = false;
openAddTrade(event: MouseEvent): void {

    event.stopPropagation();

    this.showTradeModal = true;

}
closeTradeModal(source: string = 'unknown'): void {
  console.log('Close from:', source);
  this.showTradeModal = false;
}

newTrade: Trade = {

    id: 0, date: '', pair: '',direction: 'Buy',entryPrice: 0,stopLoss: 0,takeProfit: 0,exitPrice: 0,
pointsCaptured: 0,riskReward: '',winLoss: 'Win',profit: 0,loss: 0,reason: ''

};


saveTrade(): void {

  const trade = {

    ...this.newTrade,

    id: Date.now()

  };

  this.trades.unshift(trade);

  this.closeTradeModal();

  this.newTrade = {

    id: 0,
    date: '',
    pair: '',
    direction: 'Buy',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    exitPrice: 0,
    pointsCaptured: 0,
    riskReward: '',
    winLoss: 'Win',
    profit: 0,
    loss: 0,
    reason: ''

  };

}

editTrade(trade: Trade): void {

    trade.backup = structuredClone(trade);

    trade.isEditing = true;

}
saveEdit(trade: Trade): void {

    trade.isEditing = false;

    trade.backup = undefined;

}

cancelEdit(trade: Trade): void {

    Object.assign(trade, trade.backup);

    trade.backup = undefined;

    trade.isEditing = false;

}
}
