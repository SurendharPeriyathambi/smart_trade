import { Injectable, inject } from "@angular/core";
import { WalletRepository } from "../repository/wallet.repository";
import { WalletCreatation, WalletRes } from "../models/wallet.model";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class WalletUsecase {

    private repo = inject(WalletRepository);

    execute(payload: WalletCreatation): Observable<WalletRes<WalletCreatation>> {
        return this.repo.createWallet(payload);
    }
}