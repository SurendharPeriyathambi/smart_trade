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
    { icon: 'bi bi-instagram', url: 'https://www.instagram.com/smart.tradeacademy?igsh=Z2xqbWEwZHU3eWJo' },
    // { icon: 'bi bi-vimeo', url: '#' },
    { icon: 'bi bi-youtube', url: 'https://www.youtube.com/@SmartTradeAcademy-k2v' },
 
  ];

  currentYear = new Date().getFullYear();

    isPrivacyOpen = false;
    isTermsOpen = false;

  openPrivacy() {
    this.isPrivacyOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closePrivacy() {
    this.isPrivacyOpen = false;
    document.body.style.overflow = 'auto';
  }

  openTerms(){
    this.isTermsOpen =true;
    document.body.style.overflow = 'hidden';
  }
  closeTerms(){
    this.isTermsOpen=false;
      document.body.style.overflow = 'auto';
  }
}
