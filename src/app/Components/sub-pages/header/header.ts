import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from "@angular/router";


@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink,],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
 isMenuOpen = false;

 @Input() isAuthButton = true ;
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
