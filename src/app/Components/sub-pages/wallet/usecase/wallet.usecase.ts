import { Injectable, inject } from "@angular/core";
import { WalletRepository } from "../repository/wallet.repository";
import { WalletCreatation, WalletCreatationRes, WalletRes, WalletTransactionRequest } from "../models/wallet.model";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class WalletUsecase {

    private repo = inject(WalletRepository);

    execute(payload: WalletCreatation): Observable<WalletRes<WalletCreatation>> {
        return this.repo.createWallet(payload);
    }

       getWallet(): Observable<WalletRes<WalletCreatationRes>> {
         return this.repo.getWallet();
       }

       walletaction(payload:WalletTransactionRequest):Observable<WalletRes<WalletTransactionRequest>>{
        return this.repo.walletAction(payload);
       }
}