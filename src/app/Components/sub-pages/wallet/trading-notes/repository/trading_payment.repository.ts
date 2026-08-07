import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PaymentHistory, PaymentListResponse, WalletCreatation, WalletRes } from "../../models/wallet.model";

@Injectable({providedIn:'root'})

export abstract class TradingPaymentRepository{

    abstract paymentLog(page:number,id:number):Observable<PaymentListResponse>;
        
    
}