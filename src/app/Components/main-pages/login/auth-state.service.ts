import { inject, Injectable, signal } from "@angular/core";
import { AuthServices } from "./auth.service";
import { StorageEngine } from "../../../../services/engine/storage_engine";
import { Router } from "@angular/router";
import { LoaderService } from "../../../../services/engine/loader.service";
import { ToastService } from "../../../../services/engine/toast.service";



@Injectable({ providedIn: 'root' })
export class AuthStateService {
   
    private authService = inject (AuthServices);
    
    private storage = inject (StorageEngine);
    private router =  inject (Router);
    private loader = inject (LoaderService);
    private toast = inject (ToastService);


    private _loading = signal(false);
    private _error = signal<string | null>(null);

    readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  login (email:string,password:string){
    if(this._loading())return;
    this._loading.set(true);
    this._error.set(null);
    this.loader.show();

    this.authService.login({email,password,login_ip:'12'}).subscribe({
        next:(res)=>{
         this._loading.set(false);
         this.loader.hide();
         this.storage.setAccessToken(res.data.access_token ?? '');
         this.storage.setRefreshToken(res.data.refresh_token ?? '');
         this.toast.success(res.message || "Loggin Successfull !..")
          setTimeout(() => this.router.navigate(['/subscriptions'], { replaceUrl: true }), 2000);
        },
        error:(err)=>{
            this._loading.set(false);
            this.loader.hide();
            this._error.set(err.error?.message?? 'Invalid email Or password')
            this.toast.error(this._error()!)
        }
    })
  }

  register(payload:{name:string,email:string,password:string,mobile:string}){
    if(this._loading())return;
    this._loading.set(true);
    this._error.set(null);
     this.loader.show();

    this.authService.signIn(payload).subscribe({
        next:(res)=>{
            this._loading.set(false);
            this.loader.hide();
            this.toast.success(res.message || 'Registration Successful !..')
        },
        error:(err)=>{
            this._loading.set(false);
            this.loader.hide();
            this._error.set(err.error?.message?? 'Registration Failed. Please try again..');
            this.toast.error(this._error()!);
        }
    })
  }

}