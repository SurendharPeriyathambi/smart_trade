import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from "@angular/router";
import { AuthServices } from '../../main-pages/login/auth.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { LoaderService } from '../../../../services/engine/loader.service';
import { ToastService } from '../../../../services/engine/toast.service';


@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink,],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
 isMenuOpen = false;
isLoggedIn = false; 


 @Input() isAuthButton = true ;
constructor(
  private authService: AuthServices,
  private storage: StorageEngine,
  private loader: LoaderService,
  private toast: ToastService
) {}


  ngOnInit(): void {
   this.isLoggedIn =!!this.storage.getAccessToken();
  }



  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
onLogout() {
  console.log('Logout clicked');
  this.loader.show();

  setTimeout(() => {
    this.isLoggedIn = false;
    this.loader.hide();
    this.toast.success('Logged out successfully!');
    console.log('Token after clear:', this.storage.getAccessToken()); // should be empty

    setTimeout(() => {
      console.log('Redirecting...');
      this.authService.logout();
    }, 2500);

  }, 2500);
}


}
