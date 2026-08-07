
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { WalletCreatation, WalletCreatationRes, WalletRes, WalletTransactionRequest } from "../models/wallet.model";
import { HttpEngine } from "../../../../../services/engine/http_engine";

@Injectable({
    providedIn: 'root'
})

export class WalletService{

    // private http = inject(HttpClient);
    private http = inject(HttpEngine);
   private url="http://192.168.29.78:8000";

   createWallet(payload: WalletCreatation): Observable<WalletRes<WalletCreatation>> {
        return this.http.post<WalletRes<WalletCreatation>>(`api/journal/wallet/create`, payload);
    }

     getWallet(): Observable<WalletRes<WalletCreatationRes>> {
        return this.http.get<WalletRes<WalletCreatationRes>>(`api/journal/wallet`);
      }

      walletActions(payload:WalletTransactionRequest):Observable <WalletRes<WalletTransactionRequest>>{
        return this.http.post(`api/journal/wallet/action`,payload);
      }
} 