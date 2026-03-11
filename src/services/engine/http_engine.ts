import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../app/environment';

@Injectable({ providedIn: 'root' })
export class HttpEngine {
    private baseurl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getIp(): Observable<string> {
        return this.http.get('https://api.ipify.org', { responseType: 'text',withCredentials: false });
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
}
