import { inject, Injectable, signal } from "@angular/core";
import { AuthServices } from "./auth.service";
import { StorageEngine } from "../../../../services/engine/storage_engine";
import { Router } from "@angular/router";
import { LoaderService } from "../../../../services/engine/loader.service";
import { ToastService } from "../../../../services/engine/toast.service";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { switchMap } from "rxjs";



@Injectable({ providedIn: 'root' })
export class AuthStateService {
    constructor() {
    this.initIp(); // still works fine
  }
    private authService = inject (AuthServices);
   
    private storage = inject (StorageEngine);
    private router =  inject (Router);
    private loader = inject (LoaderService);
    private toast = inject (ToastService);


    private _loading = signal(false);
    private _error = signal<string | null>(null);
 readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

    private _trxId = signal<string>('');
  readonly trxId = this._trxId.asReadonly();
    ip = signal<string>('')

  // ── Device / IP limit confirm modal ─────────────────────────────────────
  private _showDeviceLimitModal = signal(false);
  readonly showDeviceLimitModal = this._showDeviceLimitModal.asReadonly();

  // holds the in-progress login details so we can either finish login (confirm)
  // or just drop it (cancel) without asking the user to re-type anything
  private pendingLogin: { email: string; password: string; device_id: string } | null = null;
   
   private initIp() {
    // ✅ 1. Check localStorage first
    const savedIp = localStorage.getItem('user_ip');

    if (savedIp) {
      this.ip.set(savedIp);
    } else {
      // ✅ 2. Fetch from API if not available
      this.fetchIp();
    }
  }

  fetchIp() {
    this.authService.getIp().subscribe({
      next: (res) => {
        this.ip.set(res);

        //  Save for refresh persistence
        localStorage.setItem('user_ip', res);
      },
      error: () => {
      
      }
    });
  }

  setIp(ip: string) {
    this.ip.set(ip);
    localStorage.setItem('user_ip', ip);
  }

  login (email:string,password:string,device_id:string){
    if(this._loading())return;
    this._loading.set(true);
    this._error.set(null);
    this.loader.show();

 this.authService.getIp().pipe(
    switchMap((ip: string) => {
      const payload = { email, password, login_ip: device_id };
           return this.authService.login(payload);
    })
  ).subscribe({
        next:(res)=>{
         this._loading.set(false);
         this.loader.hide();

         const ipList = (res.data as any)?.user_details?.login_devices ?? [];

         if (ipList.length >= 2) {
           // backend already issued valid tokens for this login — store them now
           // so the follow-up remove_devices call has an Authorization header,
           // but hold off on the toast/navigate until the user confirms
           this.storeAuthData(email, res);
           this.pendingLogin = { email, password, device_id };
           this._showDeviceLimitModal.set(true);
           return; 
         }

         this.completeLogin(email, res);
        },
        error:(err)=>{
            this._loading.set(false);
            this.loader.hide();
            
            this._error.set(err.error?.message?? 'Invalid email Or password')
            this.toast.error(this._error()!)
        }
    })
  }

  // stores tokens/email — split out so the device-limit path can store early
  // (needed so remove_devices has an auth header) without also navigating yet
  private storeAuthData(email: string, res: any) {
    this.storage.setAccessToken(res.data.access_token ?? '');
    this.storage.setRefreshToken(res.data.refresh_token ?? '');
    this.storage.setEmail(email)
    localStorage.setItem('cached_ip', res.data.user_details.login_ip);
  }

  // toast + navigate — the "finish and enter the app" step
  private finishLogin(res: any) {
    this.toast.success(res.message || "Loggin Successfull !..")
    setTimeout(() => this.router.navigate(['/subscriptions'], { replaceUrl: true }), 2000);
  }

  // shared "finish a successful login" step for the normal (no device-limit) path
  private completeLogin(email: string, res: any) {
    this.storeAuthData(email, res);
    this.finishLogin(res);
  }

  // called when the user clicks "OK" on the device-limit popup
  confirmDeviceLogin() {
    if (!this.pendingLogin) return;

    this._loading.set(true);
    this.loader.show();

    // tokens are already stored (see login() above), so this call now carries
    // a valid Authorization header
    this.authService.removeDevice(this.pendingLogin.device_id).subscribe({
      next: (res) => {
        this._loading.set(false);
        this.loader.hide();
        this._showDeviceLimitModal.set(false);
        this.finishLogin(res);
        this.pendingLogin = null;
      },
      error: (err) => {
        this._loading.set(false);
        this.loader.hide();
        this._showDeviceLimitModal.set(false);
        this._error.set(err.error?.message ?? 'Failed to confirm login.');
        this.toast.error(this._error()!);
        this.pendingLogin = null;
      }
    });
  }

  // called when the user clicks "Cancel" / closes the popup — stays on the same login page
  cancelDeviceLogin() {
    // we stored tokens provisionally in login() to allow the confirm call to
    // authenticate — since the user backed out, clear them so they're not
    // left half-logged-in on this device
    this.storage.setAccessToken('');
    this.storage.setRefreshToken('');

    this._showDeviceLimitModal.set(false);
    this._loading.set(false);
    this.loader.hide();
    this.pendingLogin = null;
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
            setTimeout(() => this.router.navigate(['/login'], { replaceUrl: true }), 1000);
        },
        error:(err)=>{
            this._loading.set(false);
            this.loader.hide();
            this._error.set(err.error?.message?? 'Registration Failed. Please try again..');
            this.toast.error(this._error()!);
        }
    })
  }


    sendForgotOtp(email: string, onSuccess: () => void) {
    if (this._loading()) return;
    this._loading.set(true);
    this._error.set(null);
    this.loader.show();

    this.authService.forgotPassword({ email }).subscribe({
      next: (res) => {
        this._loading.set(false);
        this.loader.hide();
        this._trxId.set(res.data.trx_id);          // save trx_id for step 2
        this.toast.success(res.message || 'OTP sent to your email!');
        onSuccess();                           // let component move to step 2
      },
      error: (err) => {
        this._loading.set(false);
        this.loader.hide();
        this._error.set(err.error?.message ?? 'Failed to send OTP. Try again.');
        this.toast.error(this._error()!);
      }
    });
  }

  // ── Step 2 : Verify OTP ────────────────────────────────────────────────
  verifyForgotOtp(email: string, otp: number, onSuccess: () => void) {
    if (this._loading()) return;
    this._loading.set(true);
    this._error.set(null);
    this.loader.show();

    this.authService.verifyOTP({
      email,
      otp,
      trx_id: this._trxId()              // use the saved trx_id
    }).subscribe({
      next: (res) => {
        this._loading.set(false);
        this.loader.hide();
        this.toast.success(res.message || 'OTP verified!');
        onSuccess();                      // let component move to step 3
      },
      error: (err) => {
        this._loading.set(false);
        this.loader.hide();
        this._error.set(err.error?.message ?? 'Invalid OTP. Please try again.');
        this.toast.error(this._error()!);
      }
    });
  }

  // ── Step 3 : Change Password ───────────────────────────────────────────
  changeForgotPassword(email: string, password: string) {
    if (this._loading()) return;
    this._loading.set(true);
    this._error.set(null);
    this.loader.show();

    this.authService.changePassword({ email, password }).subscribe({
      next: (res) => {
        this._loading.set(false);
        this.loader.hide();
        this._trxId.set('');             // clear trx_id after success
        this.toast.success(res.message || 'Password updated successfully!');
        setTimeout(() => this.router.navigate(['/login'], { replaceUrl: true }), 1500);
      },
      error: (err) => {
        this._loading.set(false);
        this.loader.hide();
        this._error.set(err.error?.message ?? 'Failed to update password.');
        this.toast.error(this._error()!);
      }
    });
  }



}