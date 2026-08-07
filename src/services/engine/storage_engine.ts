import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AppStrings } from '../app_strings';

@Injectable({ providedIn: 'root' })
export class StorageEngine {
  private user_name = 'user_name';
  private user_id = 'user_name';
  private user_email = 'user_email';
  private device_id = 'device_id';
  private wallet_id ='wallet_id'
  constructor(private cookieService: CookieService) {}

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
  setEmail(email: string) {
    localStorage.setItem(this.user_email, email);
  }

  getEmail(): string {
    return localStorage.getItem(this.user_email) ?? '';
  }
  
  setId(id: any) {
    localStorage.setItem(this.user_id, id);
  }

  getId(): string {
    return localStorage.getItem(this.user_id) ?? '';
  }
    setDeviceId(deviceId: string) {
    localStorage.setItem(this.device_id, deviceId);
  }

  getDeviceId(): string {
    return localStorage.getItem(this.device_id) ?? '';
  }
   setWalletId(walletId: number): void {
    localStorage.setItem(this.wallet_id, walletId.toString());
  }

  getWalletId(): number | null {
    const id = localStorage.getItem(this.wallet_id);

    return id ? Number(id) : null;
  }


}
