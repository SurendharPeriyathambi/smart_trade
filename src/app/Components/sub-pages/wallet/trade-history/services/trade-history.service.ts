import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { TradeCreation, TradeHistoryList, TradeListResponse, TradeUpdate, WalletCreatation, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})
export class TradeHistoryService{

    private http = inject(HttpClient);
     private url = "http://192.168.29.78:8000";

    tradeCreation(payload:TradeCreation):Observable<WalletRes<TradeCreation>>{
        return this.http.post<WalletRes<TradeCreation>>(`${this.url}/trade/create`,payload)
    }
  tradeList(page: number = 1): Observable<TradeListResponse> {
  return this.http.get<TradeListResponse>(`${this.url}/trade?page=${page}`);
}
    getWallet(id: number): Observable<WalletRes<WalletCreatation>> {
    return this.http.get<WalletRes<WalletCreatation>>(`${this.url}/wallet/getWallet/${id}`);
  }
  updateTrade(id:number,trade:TradeUpdate):Observable<WalletRes<any>>{
    return this.http.patch<WalletRes<any>>(`${this.url}/trade/update/${id}`,trade)
  }
  deleteTrade(id:number):Observable<WalletRes<any>>{
    return this.http.delete<WalletRes<any>>(`${this.url}/trade/delete/${id}`)
  }
}