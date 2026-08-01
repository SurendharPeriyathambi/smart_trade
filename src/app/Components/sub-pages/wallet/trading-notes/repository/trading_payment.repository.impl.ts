import { inject, Injectable } from "@angular/core";
import { TradingPaymentRepository } from "./trading_payment.repository";
import { Observable } from "rxjs";
import { WalletRes, PaymentHistory } from "../../models/wallet.model";
import { TradingPaymentService } from "../services/trading_payment.service";

@Injectable({providedIn:'root'})
export class TradingPaymentRepositoryImpl implements  TradingPaymentRepository {
   private service = inject(TradingPaymentService)
     paymentLog(): Observable<WalletRes<PaymentHistory[]>> {
      return this.service.paymentHistoryList();
    }

} 

