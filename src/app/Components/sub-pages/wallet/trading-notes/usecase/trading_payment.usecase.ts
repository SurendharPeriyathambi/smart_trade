import { inject, Injectable } from "@angular/core";
import { TradingPaymentRepository } from "../repository/trading_payment.repository";
import { Observable } from "rxjs";
import { PaymentHistory, PaymentListResponse, WalletCreatation, WalletRes } from "../../models/wallet.model";

@Injectable ({providedIn:'root'})

export class TradingPaymentUsecase{
    private repo = inject(TradingPaymentRepository);
    
     getAll(page:number,id:number):Observable<PaymentListResponse>{
        return this.repo.paymentLog(page,id);
     }
     
}