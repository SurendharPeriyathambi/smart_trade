import { Router } from '@angular/router';
import { isPlatformBrowser,CommonModule} from '@angular/common';
import { PLATFORM_ID, Inject ,Component} from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {

   constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
 links = {
    company: ['Home', 'About Us', 'Courses'],
    support: ['Reviews', 'Contact', 'Terms of Service', 'Privacy Policy']
  };

  socialLinks = [
    { icon: 'bi bi-facebook', url: '#' },
    { icon: 'bi bi-instagram', url: 'https://www.instagram.com/smart.tradeacademy?igsh=Z2xqbWEwZHU3eWJo' },
    // { icon: 'bi bi-vimeo', url: '#' },
    { icon: 'bi bi-youtube', url: 'https://www.youtube.com/@SmartTradeAcademy-k2v' },
    {icon:'bi bi-telegram',url:''}
 
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

  
  scrollTo(sectionId: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    
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
}
  

