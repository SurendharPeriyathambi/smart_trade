import { Observable } from "rxjs";
import { WalletCreatation, WalletRes } from "../models/wallet.model";

export abstract class WalletRepository{
  abstract createWallet(payload:WalletCreatation):Observable<WalletRes<WalletCreatation>>;
}