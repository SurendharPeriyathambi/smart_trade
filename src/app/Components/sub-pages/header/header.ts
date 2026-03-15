import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
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
export class Header implements OnInit {
  isMenuOpen = false;
  isLoggedIn = false;

  @Input() isAuthButton = true;

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

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
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