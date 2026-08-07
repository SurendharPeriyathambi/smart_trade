import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TradeCreation, TradeHistoryList, TradeListResponse, TradeUpdate, WalletCreatation, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})

export abstract class TradeHistoryRepository{
    
    abstract tradeCreate(payload:TradeCreation):Observable<WalletRes<TradeCreation>>;
    abstract tradeList(id:number,page:number):Observable<TradeListResponse>;
      abstract getWallet(id: number): Observable<WalletRes<WalletCreatation>>;
    abstract tradeUpdate(trade: TradeUpdate): Observable<WalletRes<any>>;
    abstract deleteTreade(id: number): Observable<WalletRes<any>>;
}