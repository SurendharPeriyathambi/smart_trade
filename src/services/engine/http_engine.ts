import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../app/environment';
import { url } from 'node:inspector';

@Injectable({ providedIn: 'root' })
export class HttpEngine {
    private baseurl = environment.apiUrl;
     private rawHttp: HttpClient;
    constructor(private http: HttpClient, private handler: HttpBackend) { 
          this.rawHttp = new HttpClient(handler);
    }

    // getIp(): Observable<string> {
    //     return this.http.get('https://api.ipify.org', { responseType: 'text',withCredentials: false });
    // }
getIp(): Observable<string> {
        return this.rawHttp.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
            map(res => res.ip)
        );
    }
    postWithToken(endpoint: string, payload: any, token: string): Observable<any> {
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });
  return this.http.post(`${this.baseurl}${endpoint}`, payload, { headers });
}

    get<T>(url: string, isProtected: boolean = true): Observable<T> {
        return this.http.get<T>(
            `${this.baseurl}${url}`,
            // url,
            {
                headers: {
                    'x-protected': String(isProtected)
                },
                withCredentials: true
            }
        );
    }

    post<T>(url: string, body: any, isProtected: boolean = true): Observable<T> {
       const isFormData = body instanceof FormData;
      
        return this.http.post<T>(
            `${this.baseurl}${url}`,
            body,
            {
               headers: isFormData 
                ? { 'x-protected': String(isProtected) }  
                : { 'x-protected': String(isProtected) },
                withCredentials: true
            }
        );
    }

       // ─────────────────────────────────────────────
      // PUT
     // ─────────────────────────────────────────────

     put<T>(url:string,body:any,isProtected:boolean=true):Observable<T>{
        return this.http.put<T>(`${this.baseurl}${url}`,body,{
            headers:{
                'x-protected': String(isProtected)
            },
            withCredentials:true
        })
     }

     // ─────────────────────────────────────────────
    // PATCH
    // ─────────────────────────────────────────────

        patch<T>(
        url: string,
        body: any,
        isProtected: boolean = true
    ): Observable<T> {

        return this.http.patch<T>(
            `${this.baseurl}${url}`,
            body,
            {
                headers: {
                    'x-protected': String(isProtected)
                },
                withCredentials: true
            }
        );
    }

     // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────

    delete<T>(
        url: string,
        isProtected: boolean = true
    ): Observable<T> {

        return this.http.delete<T>(
            `${this.baseurl}${url}`,
            {
                headers: {
                    'x-protected': String(isProtected)
                },
                withCredentials: true
            }
        );
    }


}  
