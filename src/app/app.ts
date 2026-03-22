import { ChangeDetectorRef, Component, HostListener, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterOutlet } from '@angular/router';
import { ToastComponent } from "../services/engine/toast.component";
import { Loader } from "./Components/sub-pages/loader/loader";
import { LoaderService } from '../services/engine/loader.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthServices } from './Components/main-pages/login/auth.service';
import { StorageEngine } from '../services/engine/storage_engine';

// Refresh reloads in < 1 second. Tab close = no reload follows.
// On next launch after a close, the gap will be many seconds/minutes.
// 5 seconds is a safe threshold even on very slow machines.
const CLOSE_THRESHOLD_MS = 5000;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, Loader, AsyncPipe, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  protected readonly title = signal('smart-trade-academy');
  loading$: any;

  constructor(
    private authService: AuthServices,
    private router: Router,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef,
    private storage: StorageEngine
  ) {
    this.loading$ = this.loaderService.loading$;

    if (typeof window !== 'undefined') {
      this._handleSessionOnLoad();
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        setTimeout(() => {
          this.loaderService.show();
          this.cdr.detectChanges();
        }, 0);
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
        setTimeout(() => {
          this.loaderService.hide();
          this.cdr.detectChanges();
        }, 0);
      }
    });
  }

  private _handleSessionOnLoad(): void {
    const unloadTime = localStorage.getItem('unload_time');
    localStorage.removeItem('unload_time'); // always clean up immediately

    if (!unloadTime) return; // first ever visit — nothing to check

    const diff = Date.now() - Number(unloadTime);

    if (diff > CLOSE_THRESHOLD_MS) {
      // Gap is large → was a real tab close, not a refresh → logout now
      const email = this.storage.getEmail();
      if (email) {
        this.authService.logoutSync(email);
      }
      this.storage.clear();
    }
    // Gap is small → was a refresh → do nothing, keep session
  }

  // ✅ ONLY stamps the time. NEVER calls logout here.
  // Logout decision is made on the NEXT load based on the time gap.
  @HostListener('window:beforeunload')
  onTabClose(): void {
    const token = this.storage.getAccessToken();
    if (!token) return;
    localStorage.setItem('unload_time', Date.now().toString());
  }
}