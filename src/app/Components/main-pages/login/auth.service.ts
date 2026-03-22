import { Injectable } from "@angular/core";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { Observable, switchMap, tap } from "rxjs";
import { Datas, LoginResponce } from "../../../../interfaces/login.interface";
import { environment } from "../../../environment";
import { signData, SignInResponce } from "../../../../interfaces/signIn.interface";
import { StorageEngine } from "../../../../services/engine/storage_engine";
import { Router } from "@angular/router";


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

logoutSync(email: string): void {
    const url = `${this.baseUrl}api/auth/logout`;
    const token = this.storage.getAccessToken();
    const ip = this.cachedIp || localStorage.getItem('cached_ip') || '';
 
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, login_ip: ip }),
      keepalive: true
    });
  }
}