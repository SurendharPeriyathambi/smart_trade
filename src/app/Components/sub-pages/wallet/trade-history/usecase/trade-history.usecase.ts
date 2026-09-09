import { inject, Injectable } from "@angular/core";
import { TradeHistoryRepository } from "../repository/trade-history.Repository";
import { Observable } from "rxjs";
import { TradeCreation, TradeHistoryList, TradeListResponse, TradeUpdate, WalletCreatation, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})
export class TradeHistoryUsecase {

    private repo = inject (TradeHistoryRepository);

    tradeCreate(payload:TradeCreation):Observable<WalletRes<TradeCreation>>{
        return this.repo.tradeCreate(payload);
    }  

    getTradeLists(id:number,page:number):Observable<TradeListResponse>{
        return this.repo.tradeList(id,page);
    }

     getWallet(id: number): Observable<WalletRes<WalletCreatation>> {
    return this.repo.getWallet(id);
  }

  updateTrade(trade:TradeUpdate):Observable<WalletRes<any>>{
    return this.repo.tradeUpdate(trade)
  }
  deleteTrade(id:number):Observable<WalletRes<any>>{
    return this.repo.deleteTreade(id)
  }
}