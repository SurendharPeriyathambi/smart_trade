import { Injectable } from "@angular/core";
import { HttpEngine } from "../../../../services/engine/http_engine";
import { Observable } from "rxjs";
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
    constructor (private http:HttpEngine,private storage:StorageEngine,private router:Router){}

    getIp():Observable<string>{
        return this.http.getIp();
    }

    login(payload:{email:string;password:string;login_ip:string}):Observable<LoginResponce<Datas>>{
        return this.http.post(`api/auth/login`,payload,false)
    }

    signIn(payload:{name:string;email:string;password:string;mobile:string}):Observable<SignInResponce<signData>>{
        return this.http.post(`api/user/register`,payload,false)
    }


    logout(): void {
    this.storage.clear();             // clears all cookies + localStorage
    this.router.navigate(['/login']); // redirect to login
}
}