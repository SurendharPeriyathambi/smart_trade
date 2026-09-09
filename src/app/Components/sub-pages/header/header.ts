import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  HostListener,
  PLATFORM_ID,
  inject,
  AfterViewInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../main-pages/login/auth.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { LoaderService } from '../../../../services/engine/loader.service';
import { ToastService } from '../../../../services/engine/toast.service';
import { DeviceService } from '../../main-pages/login/device.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  isMenuOpen = false;
  isLoggedIn = false;
  deviceId: string = '';

  @Input() isAuthButton = true;
  @Input() showLogout = false;

  private platformId = inject(PLATFORM_ID);
  constructor(
    private authService: AuthServices,
    private storage: StorageEngine,
    private loader: LoaderService,
    private toast: ToastService,
    private router: Router,
    private deviceService: DeviceService,
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = !!this.storage.getAccessToken();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  scrollTo(sectionId: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.closeMenu();
    const currentUrl = this.router.url.split('#')[0];
    if (currentUrl === '/home') {
      const element = document.getElementById(sectionId);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      this.router.navigate(['/home']).then(() => {
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      });
    }
  }

  async onLogout() {
    this.loader.show();
    this.closeMenu();
    this.authService.logout().subscribe({
      next: () => {
        this.storage.clear();
        localStorage.removeItem('pending_logout'); // ✅ clean up
        localStorage.removeItem('unload_time');
        this.isLoggedIn = false;
        this.loader.hide();
        this.toast.success('Logged out successfully!');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loader.hide();
        const message = err.error.message || 'Logout failed. Please try again.'
        if (message.toLowerCase().includes('session not found for this device')) {
          this.storage.clear();
          localStorage.removeItem('pending_logout');
          localStorage.removeItem('unload_time');
          this.isLoggedIn = false;
          this.toast.error(message);
          setTimeout(() => this.router.navigate(['/login']), 2500);
          return;
        }
        this.toast.error(message);
      },
    });
  }
}
