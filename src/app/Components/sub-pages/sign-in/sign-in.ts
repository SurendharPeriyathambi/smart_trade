import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgModule, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../main-pages/login/auth.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { Datas, LoginResponce } from '../../../../interfaces/login.interface';
import { ToastService } from '../../../../services/engine/toast.service';
import { finalize } from 'rxjs';
import { LoaderService } from '../../../../services/engine/loader.service';
import { AuthStateService } from '../../main-pages/login/auth-state.service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  
 
  showPassword = false;

  protected authService  = inject (AuthStateService);

   signInForm: FormGroup = inject(FormBuilder).group({
    email:['',[Validators.required, Validators.email]],
    password:['',[Validators.required,Validators.minLength(6)]]
   });

  togglePassword(){
    this.showPassword = !this.showPassword;
  }
onSubmit(){
  if (this.signInForm.invalid) {
    this.signInForm.markAllAsTouched();
    return;
  }
  const {email,password}= this.signInForm.value;
  this.authService.login(email,password);
  
}

  get email() {
    return this.signInForm.get('email');
  }

  get password() {
    return this.signInForm.get('password');
  }
}