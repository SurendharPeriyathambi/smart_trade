import { Injectable } from '@angular/core';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { StorageEngine } from '../../../../services/engine/storage_engine';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  constructor(private storage: StorageEngine) {}
  async getDeviceId(): Promise<string> {
    // Load Fingerprint
    const fp = await FingerprintJS.load();
    // Generate Device Fingerprint
    const result = await fp.get();
    this.storage.setDeviceId(result.visitorId);
    // Unique Device ID
    return result.visitorId;
  }
}
