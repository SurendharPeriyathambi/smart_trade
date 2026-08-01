import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PaymentHistory, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})

export abstract class TradingPaymentRepository{

    abstract paymentLog():Observable<WalletRes<PaymentHistory[]>>;
}