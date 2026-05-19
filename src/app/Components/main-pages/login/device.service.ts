import { Injectable } from '@angular/core';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  async getDeviceId(): Promise<string> {

    // Load Fingerprint
    const fp = await FingerprintJS.load();

    // Generate Device Fingerprint
    const result = await fp.get();

    // Unique Device ID
    return result.visitorId;
  }
}