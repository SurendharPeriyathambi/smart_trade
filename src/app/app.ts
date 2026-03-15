import { ChangeDetectorRef, Component, HostListener, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterOutlet } from '@angular/router';
import { ToastComponent } from "../services/engine/toast.component";
import { Loader } from "./Components/sub-pages/loader/loader";
import { LoaderService } from '../services/engine/loader.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthServices } from './Components/main-pages/login/auth.service';
import { StorageEngine } from '../services/engine/storage_engine';

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
    // ✅ On every load, check if previous unload was a refresh or close
    const unloadTime = localStorage.getItem('unload_time');
    const loadTime = Date.now();

    if (unloadTime) {
      const diff = loadTime - Number(unloadTime);
      // ✅ If page reloaded within 3 seconds — it was a refresh, keep login
      // If more than 3 seconds — it was a tab close that failed to logout, clear now
      if (diff > 3000) {
        this.storage.clear();
      }
    }

    localStorage.removeItem('unload_time');
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

@HostListener('window:beforeunload')
onTabClose(): void {
  const token = this.storage.getAccessToken();
  if (!token) return;

  // ✅ Always stamp the unload time
  localStorage.setItem('unload_time', Date.now().toString());

  // ✅ Always attempt logout on unload (works for both refresh and close)
  // For refresh: backend logs out but user logs back in immediately — OR
  // use the time-based check on reload to avoid API call on refresh
  this.authService.logoutSync(this.storage.getEmail());
}
}