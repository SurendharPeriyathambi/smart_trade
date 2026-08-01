import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TradeCreation, TradeHistoryList, TradeListResponse, TradeUpdate, WalletCreatation, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})

export abstract class TradeHistoryRepository{
    
    abstract tradeCreate(payload:TradeCreation):Observable<WalletRes<TradeCreation>>;
    abstract tradeList(page:number):Observable<TradeListResponse>;
      abstract getWallet(id: number): Observable<WalletRes<WalletCreatation>>;
    abstract tradeUpdate(id: number, trade: TradeUpdate): Observable<WalletRes<any>>;
    abstract deleteTreade(id: number): Observable<WalletRes<any>>;
}