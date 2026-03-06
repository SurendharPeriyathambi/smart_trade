import { afterNextRender, Component, inject, OnInit } from '@angular/core';
import { SignIn } from "../../sub-pages/sign-in/sign-in";
import { SignUp } from "../../sub-pages/sign-up/sign-up";
import { Header } from "../../sub-pages/header/header";
import { Footer } from "../../sub-pages/footer/footer";
import { AuthServices } from './auth.service';
import { AuthStateService } from './auth-state.service';
import { error } from 'console';

@Component({
  selector: 'app-login',
  imports: [SignIn, SignUp, Header, Footer],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {

  private authService =inject (AuthServices);
  private authState = inject (AuthStateService);
 ip : string = '';

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
    next: (res)=> this.ip = res,
    error: err => console.log('Failed to get Ip',err)
   })
  }
}
