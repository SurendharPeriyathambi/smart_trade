export interface WalletRes<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface WalletCreatation{
    user_id:number;
   date:string;
    amount:number;
    id?:number;
}
export interface WalletCreatationRes{
    user_id:number;
   create_date:string;
    amount:number;
    id?:number;
}

export interface WalletTransactionRequest {
  // wallet_id: number;
  action: 'deposite' | 'withdraw';
  amount: string;
  date?:string
}
export interface PaymentHistory {
  id: number;
  walletId: number;
  description?: string;
  amount: number;
  action: PaymentAction;
  isDelete: boolean;
  created_date: string;
  updated_at: string;
  balance:number;
  direction:string;
}
export interface PaymentListResponse {
  status: boolean;
  message: string;
  data: {
     current_page: number;
     total_records: number;
    data_list: PaymentHistory[];
  };
}

export type PaymentAction =
  | 'WITHDRAW'
  | 'DEPOSIT'
  | 'TRADE ENTRY';

  export interface TradeCreation{
    // user_id:number
     wallet_id :number,
     date : string,
     pair : string ,
     lot_size :number,
     direction : string ,
      entry_price :number,
     stop_loss :number,
     take_profit :number,
     exit_price :number,
     points_captured :number,
     win_loss :string,
     risk_reward : number ,
     reason : string ,
     profit :number,
     loss :number,
     remark : string 
}
export interface TradeHistoryList {
    id: number;
    date: string;
    pair: string;
    direction: string;
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    exit_price: number;
    points_captured: number;
    risk_reward: number;
    win_loss: string;
    lot_size:number;
    profit: number;
    loss: number;
    reason: string;
    remark: string;
}
export interface TradeListResponse {
  status: boolean;
  message: string;
  data: {
     current_page: number;
     total_records: number;
    data_list: TradeHistoryList[];
  };
}
export interface TradeUpdate {
  id: number;
 
  wallet_id: number;
  date: string;
  pair: string;
  lot_size: number;
  direction: string;
  stop_loss: number;
  take_profit: number;
  exit_price: number;
  points_captured: number;
  win_loss: string;
  risk_reward: number;
  reason: string;
  entry_price: number;
  profit: number;
  loss: number;
  remark: string;
}