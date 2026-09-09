import { Observable } from "rxjs";
import { WalletCreatation, WalletCreatationRes, WalletRes, WalletTransactionRequest } from "../models/wallet.model";

export abstract class WalletRepository{
  abstract createWallet(payload:WalletCreatation):Observable<WalletRes<WalletCreatation>>;
    abstract getWallet(): Observable<WalletRes<WalletCreatationRes>>;
    abstract walletAction(payload:WalletTransactionRequest):Observable<WalletRes<WalletTransactionRequest>>
}