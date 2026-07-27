import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, output, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../main-pages/login/auth.service';
import { ToastService } from '../../../../services/engine/toast.service';
import { AuthStateService } from '../../main-pages/login/auth-state.service';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
   goToSignin = output<void>();
protected authState = inject(AuthStateService);
  showPassword = false;
  showConfirmPassword = false;
 openSignin() {
    this.goToSignin.emit();
  }
togglePassword(){
  this.showPassword = !this.showPassword;
}
toggleConfirmPassword(){
  this.showConfirmPassword=!this.showConfirmPassword;
}

  signUpForm: FormGroup = inject(FormBuilder).group({
    username: ['', [Validators.required, Validators.minLength(3),Validators.pattern(/^[a-zA-Z0-9]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, Validators.minLength(10),Validators.pattern(/^[6-9][0-9]{9}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    agreeToTerms: [false, [Validators.requiredTrue]]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pw = control.get('password');
    const cpw = control.get('confirmPassword');
    if (!pw || !cpw) return null;
    return pw.value === cpw.value ? null : { passwordMismatch: true };
  }

  onSubmit() {

    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }
    const { username, email, mobile, password } = this.signUpForm.value;
    this.authState.register({ name: username, email, mobile, password }); //  delegate
     this.signUpForm.reset();
  }

  get username() { return this.signUpForm.get('username'); }
  get email() { return this.signUpForm.get('email'); }
  get password() { return this.signUpForm.get('password'); }
  get confirmPassword() { return this.signUpForm.get('confirmPassword'); }
  get agreeToTerms() { return this.signUpForm.get('agreeToTerms'); }



  @Output() privacyClick = new EventEmitter<void>();
@Output() termsClick = new EventEmitter<void>();

openPrivacy() {
  this.privacyClick.emit();
}

openTerms() {
  this.termsClick.emit();
}

get mobile() {
  return this.signUpForm.get('mobile');
}

onMobileKeyPress(event: KeyboardEvent) {
  const charCode = event.which ? event.which : event.keyCode;
  if (charCode < 48 || charCode > 57) {
    event.preventDefault();
  }
}

onMobileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/[^0-9]/g, '');
  if (value.length > 10) {
    value = value.substring(0, 10);
  }
  input.value = value;
  this.mobile?.setValue(value);
}

onUsernameKeyPress(event: KeyboardEvent) {
  const charCode = event.which ? event.which : event.keyCode;
  const char = String.fromCharCode(charCode);
  if (!/^[a-zA-Z0-9]$/.test(char)) {
    event.preventDefault();
  }
}

onUsernameInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value.replace(/[^a-zA-Z0-9]/g, '');
  input.value = value;
  this.username?.setValue(value);
}
}