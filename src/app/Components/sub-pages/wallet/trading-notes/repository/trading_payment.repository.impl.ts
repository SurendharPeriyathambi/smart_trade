import { inject, Injectable } from "@angular/core";
import { TradingPaymentRepository } from "./trading_payment.repository";
import { Observable } from "rxjs";
import { WalletRes, PaymentHistory, PaymentListResponse, WalletCreatation } from "../../models/wallet.model";
import { TradingPaymentService } from "../services/trading_payment.service";

@Injectable({providedIn:'root'})
export class TradingPaymentRepositoryImpl implements  TradingPaymentRepository {
   private service = inject(TradingPaymentService)
     paymentLog(page:number,id:number): Observable<PaymentListResponse> {
      return this.service.paymentHistoryList(page,id);
    }
    
} 

