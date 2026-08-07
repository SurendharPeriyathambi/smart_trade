
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TradeCreation, TradeHistoryList, TradeListResponse, TradeUpdate, WalletCreatation, WalletRes } from "../../models/wallet.model";
import { HttpEngine } from "../../../../../../services/engine/http_engine";

@Injectable({providedIn:'root'})
export class TradeHistoryService{

    private http = inject(HttpEngine);
     private url = "http://192.168.29.78:8000";

    tradeCreation(payload:TradeCreation):Observable<WalletRes<TradeCreation>>{
        return this.http.post<WalletRes<TradeCreation>>(`api/journal/trade/create`,payload)
    }
  tradeList(id:number,page: number = 1): Observable<TradeListResponse> {
  return this.http.get<TradeListResponse>(`api/journal/trade/${id}?page=${page}`);
}
    getWallet(id: number): Observable<WalletRes<WalletCreatation>> {
    return this.http.get<WalletRes<WalletCreatation>>(`${this.url}/wallet/getWallet/${id}`);
  }
  updateTrade(trade:TradeUpdate):Observable<WalletRes<any>>{
    return this.http.post<WalletRes<any>>(`api/journal/trade/edit`,trade)
  }
  deleteTrade(id:number):Observable<WalletRes<any>>{
    return this.http.delete<WalletRes<any>>(`${this.url}/trade/delete/${id}`)
  }
}