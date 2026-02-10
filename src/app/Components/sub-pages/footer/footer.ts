import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
 links = {
    company: ['Home', 'About Us', 'Courses'],
    support: ['Reviews', 'Contact', 'Terms of Service', 'Privacy Policy']
  };

  socialLinks = [
    { icon: 'bi bi-facebook', url: '#' },
    { icon: 'bi bi-twitter-x', url: '#' },
    // { icon: 'bi bi-vimeo', url: '#' },
    { icon: 'bi bi-youtube', url: '#' },
 
  ];

  currentYear = new Date().getFullYear();
}
