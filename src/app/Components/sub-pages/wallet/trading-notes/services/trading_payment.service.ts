import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PaymentHistory, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})

export class TradingPaymentService{

    private http = inject(HttpClient);
    private url = "http://192.168.29.78:8000";

    paymentHistoryList():Observable<WalletRes<PaymentHistory[]> >{

        return this.http.get<WalletRes<PaymentHistory[]>>(`${this.url}/paymentlog`)
    }

}