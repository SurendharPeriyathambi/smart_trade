import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgModule, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../main-pages/login/auth.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { Datas, LoginResponce } from '../../../../interfaces/login.interface';
import { ToastService } from '../../../../services/engine/toast.service';
import { finalize } from 'rxjs';
import { LoaderService } from '../../../../services/engine/loader.service';
import { AuthStateService } from '../../main-pages/login/auth-state.service';
import { DeviceService } from '../../main-pages/login/device.service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  
  goToSignup = output<void>();
  showPassword = false;
  deviceId:string='';

  protected authService  = inject (AuthStateService);
  private deviceService=inject(DeviceService)

   signInForm: FormGroup = inject(FormBuilder).group({
    email:['',[Validators.required, Validators.email]],
    password:['',[Validators.required,Validators.minLength(6)]]
   });

  togglePassword(){
    this.showPassword = !this.showPassword;
  }
  async onSubmit(){
  if (this.signInForm.invalid) {
    this.signInForm.markAllAsTouched();
    return;
  }
  this.deviceId =
        await this.deviceService.getDeviceId();
  const {email,password}= this.signInForm.value;
  this.authService.login(email,password,this.deviceId);
  
}

  get email() {
    return this.signInForm.get('email');
  }

  get password() {
    return this.signInForm.get('password');
  }
    openSignup() {
    this.goToSignup.emit();
  }
}