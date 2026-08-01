import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { WalletRepository } from "./wallet.repository";
import { WalletService } from "../services/wallet.service";
import { WalletCreatation, WalletRes } from "../models/wallet.model";

@Injectable({providedIn:'root'})
export class WalletRepositoryImpl implements WalletRepository {
   
    private service = inject(WalletService);

    createWallet(payload: WalletCreatation): Observable<WalletRes<WalletCreatation>> {
       return this.service.createWallet(payload);
   }
}

