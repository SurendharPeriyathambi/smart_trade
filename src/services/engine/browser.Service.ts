import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BrowserService {

  private readonly MIN_CHROME_VERSION = 120;

  isChromeSupported(): boolean {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);

    if (!match) {
      return false;
    }

    const version = Number(match[1]);

    return version >= this.MIN_CHROME_VERSION;
  }

  getChromeVersion(): number | null {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);

    return match ? Number(match[1]) : null;
  }
}