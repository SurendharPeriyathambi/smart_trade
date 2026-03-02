import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../main-pages/login/auth.service';
import { ToastService } from '../../../../services/engine/toast.service';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
signUpForm: FormGroup;
  showPassword = false;
  isLoading=false
  errorMessage = '';

  showConfirmPassword = false;

      constructor
       (private fb: FormBuilder,
        private autheService:AuthServices,
        private router : Router,
         private toast: ToastService
         
        ) {
    this.signUpForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      console.log('Sign Up Form Data:', this.signUpForm.value);
      // Add your registration logic here

      const payload={
        name:this.signUpForm.value.username,
         email: this.signUpForm.value.email,
        mobile: this.signUpForm.value.mobile,
        password: this.signUpForm.value.password
      };

      this.autheService.signIn(payload).subscribe({
        next:(res)=>{
          this.isLoading=false
           console.log('Registration successful:', res);
             this.toast.success(res.message || 'Registration successful!');
        setTimeout(() => this.router.navigate(['/subscriptions']), 1500);
        },
         error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
          console.error('Registration error:', err);
          this.toast.error(this.errorMessage)
        }
      }
    
    )
    } else {
      Object.keys(this.signUpForm.controls).forEach(key => {
        this.signUpForm.get(key)?.markAsTouched();
      });
    }
  }

  get username() {
    return this.signUpForm.get('username');
  }

  get email() {
    return this.signUpForm.get('email');
  }

  get password() {
    return this.signUpForm.get('password');
  }

  get confirmPassword() {
    return this.signUpForm.get('confirmPassword');
  }

  get agreeToTerms() {
    return this.signUpForm.get('agreeToTerms');
  }
}