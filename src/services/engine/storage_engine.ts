import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { AppStrings } from "../app_strings";

@Injectable({ providedIn: 'root' })
export class StorageEngine {
 private user_name = 'user_name';
    private user_email = 'user_email';
    constructor(private cookieService: CookieService) {

    }

    getAccessToken(): string {
        return this.cookieService.get('access_token');
    }

    getRefreshToken(): string {
        return this.cookieService.get('refresh_token');
    }
    setAccessToken(token: string) {
        this.cookieService.set('access_token', token, 0.5, '/', undefined, false, 'Lax');
    }
    setRefreshToken(token: string) {
        this.cookieService.set('refresh_token', token, 0.520833, '/', undefined, false, 'Lax');
    }
    clear() {
        localStorage.clear();
        this.cookieService.deleteAll('/');
    }
    //  storeUser(name: string, email: string) {
    //     localStorage.setItem(this.user_name, name);
    //     localStorage.setItem(this.user_email, email);
    // }

}