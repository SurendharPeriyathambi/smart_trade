import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { WalletCreatation, WalletRes } from "../models/wallet.model";

@Injectable({
    providedIn: 'root'
})

export class WalletService{

    private http = inject(HttpClient);
   private url="http://192.168.29.78:8000"

   createWallet(payload: WalletCreatation): Observable<WalletRes<WalletCreatation>> {
        return this.http.post<WalletRes<WalletCreatation>>(`${this.url}/wallet/create`, payload);
    }
}