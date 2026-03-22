import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../main-pages/login/auth.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { LoaderService } from '../../../../services/engine/loader.service';
import { ToastService } from '../../../../services/engine/toast.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  isMenuOpen = false;
  isLoggedIn = false;

  @Input() isAuthButton = true;
  @Input() showLogout = false;

  constructor(
    private authService: AuthServices,
    private storage: StorageEngine,
    private loader: LoaderService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.storage.getAccessToken();
  }

  // ✅ KEY TRICK:
  // beforeunload fires for BOTH refresh and tab close.
  // We write a flag into sessionStorage here.
  //
  // sessionStorage behaviour:
  //   — On REFRESH: sessionStorage is KEPT. Flag survives.
  //   — On TAB CLOSE: sessionStorage is WIPED by the browser. Flag gone.
  //
  // So in ngOnDestroy we read the flag:
  //   Flag present  → it was a refresh  → skip logout
  //   Flag absent   → it was a tab close → fire logout
  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    sessionStorage.setItem('is_refreshing', '1');
  }

  ngOnDestroy(): void {
    const isRefreshing = sessionStorage.getItem('is_refreshing') === '1';

    // Always clean up the flag for the next unload cycle
    sessionStorage.removeItem('is_refreshing');

    if (this.isLoggedIn && !isRefreshing) {
      // Real tab close — fire keepalive logout
      const email = this.storage.getEmail();
      if (email) {
        this.authService.logoutSync(email);
      }
    }
    // Refresh → do nothing, token stays, user stays logged in
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  scrollTo(sectionId: string) {
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

  onLogout() {
    this.loader.show();
    this.closeMenu();
    this.authService.logout().subscribe({
      next: () => {
        this.storage.clear();
        this.isLoggedIn = false;
        this.loader.hide();
        this.toast.success('Logged out successfully!');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loader.hide();
        this.toast.error('Logout failed. Please try again.');
        console.error('Logout error:', err);
      }
    });
  }
}