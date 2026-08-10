import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-errorpage',
  imports: [CommonModule,RouterModule],
  templateUrl: './errorpage.html',
  styleUrl: './errorpage.scss',
})
export class Errorpage {
 title = '404-page';
 constructor(private router: Router) {}
 
  goHome(): void {
    this.router.navigateByUrl('/');
  }
}
