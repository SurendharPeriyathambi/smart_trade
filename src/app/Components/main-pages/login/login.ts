import { afterNextRender, Component, HostListener, inject, OnInit } from '@angular/core';
import { SignIn } from "../../sub-pages/sign-in/sign-in";
import { SignUp } from "../../sub-pages/sign-up/sign-up";
import { Header } from "../../sub-pages/header/header";
import { Footer } from "../../sub-pages/footer/footer";
import { AuthServices } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { CommonModule } from '@angular/common';
import { DeviceService } from './device.service';


@Component({
  selector: 'app-login',
  imports: [SignIn, SignUp, Header, Footer,CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
 isSignIn = true;
  isMobile = window.innerWidth < 768;

  private authService =inject (AuthServices);
  protected authState = inject (AuthStateService);
    private deviceService =
    inject(DeviceService);
    ip : string = '';
    deviceId: string = '';

 constructor() {
   afterNextRender(() => {
     if (typeof window !== 'undefined') {
  window.scrollTo({ top: 0, behavior: 'instant' });
}
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
 }
  ngOnInit(): void {
   this.authService.getIp().subscribe({
    next: (res)=>{this.ip = res
      this.authState.setIp(res);
    } ,
    
   
   })
  }


  isPrivacyOpen = false;
isTermsOpen = false;

openPrivacy() {
  this.isPrivacyOpen = true;
  document.body.style.overflow = 'hidden';
}

openTerms() {
  this.isTermsOpen = true;
  document.body.style.overflow = 'hidden';
}

closeModal() {
  this.isPrivacyOpen = false;
  this.isTermsOpen = false;
  document.body.style.overflow = 'auto';
}


  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  showSignUp() {
    this.isSignIn = false;
  }

  showSignIn() {
    this.isSignIn = true;
  }
}
