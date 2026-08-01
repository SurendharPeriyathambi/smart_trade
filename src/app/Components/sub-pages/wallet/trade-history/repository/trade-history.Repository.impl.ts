import { inject, Injectable } from "@angular/core";
import { TradeHistoryRepository } from "./trade-history.Repository";
import { TradeHistoryService } from "../services/trade-history.service";
import { Observable } from "rxjs";
import { TradeCreation, TradeHistoryList, TradeListResponse, TradeUpdate, WalletCreatation, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})

export class TradeHistoryRepositoryImpl implements TradeHistoryRepository{
    
    private service = inject(TradeHistoryService);

     tradeCreate(payload: TradeCreation): Observable<WalletRes<TradeCreation>> {
        return this.service.tradeCreation(payload)
    }
    
     tradeList(page:number): Observable<TradeListResponse> {
        return this.service.tradeList(page);
    }
     getWallet(id: number): Observable<WalletRes<WalletCreatation>> {
    return this.service.getWallet(id);
  }
   tradeUpdate(id: number, trade: TradeUpdate): Observable<WalletRes<any>> {
   return this.service.updateTrade(id,trade)   
  }
 
   deleteTreade(id: number): Observable<WalletRes<any>> {
      return this.service.deleteTrade(id);
  }
}