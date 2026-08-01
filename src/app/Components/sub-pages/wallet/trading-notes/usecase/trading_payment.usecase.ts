import { inject, Injectable } from "@angular/core";
import { TradingPaymentRepository } from "../repository/trading_payment.repository";
import { Observable } from "rxjs";
import { PaymentHistory, WalletRes } from "../../models/wallet.model";

@Injectable ({providedIn:'root'})

export class TradingPaymentUsecase{
    private repo = inject(TradingPaymentRepository);
    
     getAll():Observable<WalletRes<PaymentHistory[]>>{
        return this.repo.paymentLog();
     }
}