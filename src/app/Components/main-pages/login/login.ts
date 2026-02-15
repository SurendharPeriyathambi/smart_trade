import { afterNextRender, Component } from '@angular/core';
import { SignIn } from "../../sub-pages/sign-in/sign-in";
import { SignUp } from "../../sub-pages/sign-up/sign-up";
import { Header } from "../../sub-pages/header/header";
import { Footer } from "../../sub-pages/footer/footer";

@Component({
  selector: 'app-login',
  imports: [SignIn, SignUp, Header, Footer],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
 constructor() {
   afterNextRender(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
 }
}
