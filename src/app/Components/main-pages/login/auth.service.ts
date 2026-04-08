import { Injectable } from "@angular/core";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { Observable, switchMap, tap } from "rxjs";
import { ChangePasswordRequest, ChangePasswordResponse, Datas, ForgotPassWordRequest, ForgotPasswordResponse, LoginResponce, verifyOTPRequest, VerifyOtpResponse } from "../../../../interfaces/login.interface";
import { environment } from "../../../environment";
import { signData, SignInResponce } from "../../../../interfaces/signIn.interface";
import { StorageEngine } from "../../../../services/engine/storage_engine";
import { Router } from "@angular/router";
const CLOSE_THRESHOLD_MS = 5000;

@Injectable ({
    providedIn:'root'
})

export class AuthServices{
baseUrl = environment.apiUrl;
private cachedIp: string = ''; 
    constructor (private http:HttpEngine,private storage:StorageEngine,private router:Router){}

    getIp():Observable<string>{
        return this.http.getIp().pipe(tap((ip:string)=>{this.cachedIp=ip; localStorage.setItem('cached_ip', ip)}));
    }

    login(payload:{email:string;password:string;login_ip:string}):Observable<LoginResponce<Datas>>{
           
   
        return this.http.post(`api/auth/login`,payload,false)
    }

    signIn(payload:{name:string;email:string;password:string;mobile:string}):Observable<SignInResponce<signData>>{
        return this.http.post(`api/user/register`,payload,false)
    }


logout(): Observable<any> {
    return this.http.getIp().pipe(
        switchMap((ip: string) => {
            const payload = {
                email: this.storage.getEmail(),
                login_ip: ip
            };
            return this.http.post(`api/auth/logout`, payload, true);
        })
    );
}
// ✅ Store everything needed for logout BEFORE tab closes
storeLogoutData(): void {
  const token = this.storage.getAccessToken();
  const email = this.storage.getEmail();
  const ip = this.cachedIp || localStorage.getItem('cached_ip') || '';

  if (!token || !email) return;

  localStorage.setItem('pending_logout', JSON.stringify({
    token,
    email,
    ip,
    timestamp: Date.now()
  }));
}

// ✅ Called on next visit — full normal HTTP with no time pressure
logoutFromPreviousSession(): Observable<any> {
  const raw = localStorage.getItem('pending_logout');
  localStorage.removeItem('pending_logout'); // always clean up

  if (!raw) return new Observable(o => o.complete());

  const { token, email, ip, timestamp } = JSON.parse(raw);
  const diff = Date.now() - timestamp;

  if (diff <= CLOSE_THRESHOLD_MS) {
    // Was a refresh, not a close — skip logout
    return new Observable(o => o.complete());
  }

  // ✅ Full HTTP call — same as normal logout, guaranteed to work
  return this.http.postWithToken(
    `api/auth/logout`,
    { email, login_ip: ip },
    token  // pass token explicitly since storage is already cleared
  );
}


  forgotPassword(payload:ForgotPassWordRequest):Observable<ForgotPasswordResponse>{
    return this.http.post<ForgotPasswordResponse>('api/auth/forgot_password',payload).pipe(tap(res => console.log('forgot_password response:', res)))
    
  }

  verifyOTP(payload:verifyOTPRequest):Observable<VerifyOtpResponse>{
    return  this.http.post<VerifyOtpResponse>('api/auth/verify_otp',payload)
  }
  changePassword(payload: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.post<ChangePasswordResponse>(
      `api/auth/change_password`, payload
    );
  }
}