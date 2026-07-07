import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getRole(): string {
    return 'admin'; // hardcoded — no login needed
  }
}