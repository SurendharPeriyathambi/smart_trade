import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { WalletRepository } from "./wallet.repository";
import { WalletService } from "../services/wallet.service";
import { WalletCreatation, WalletCreatationRes, WalletRes, WalletTransactionRequest } from "../models/wallet.model";

@Injectable({providedIn:'root'})
export class WalletRepositoryImpl implements WalletRepository {
   
    private service = inject(WalletService);

    createWallet(payload: WalletCreatation): Observable<WalletRes<WalletCreatation>> {
       return this.service.createWallet(payload);
   }
      getWallet(): Observable<WalletRes<WalletCreatationRes>> {
        return this.service.getWallet();
      }

       walletAction(payload: WalletTransactionRequest): Observable<WalletRes<WalletTransactionRequest>> {
          return this.service.walletActions(payload)
      }
}

