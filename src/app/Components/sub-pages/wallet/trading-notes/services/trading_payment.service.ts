import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PaymentHistory, PaymentListResponse, WalletCreatation, WalletRes } from "../../models/wallet.model";
import { HttpEngine } from "../../../../../../services/engine/http_engine";

@Injectable({providedIn:'root'})

export class TradingPaymentService{

    private http = inject(HttpEngine);
    // private url = "http://192.168.29.78:8000";

    paymentHistoryList(id:number,page: number = 1):Observable<PaymentListResponse>{

        return this.http.get<PaymentListResponse>(`api/journal/wallet/${id}?page=${page}`)
    }
  

}