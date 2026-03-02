import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgModule, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../main-pages/login/auth.service';
import { StorageEngine } from '../../../../services/engine/storage_engine';
import { Datas, LoginResponce } from '../../../../interfaces/login.interface';
import { ToastService } from '../../../../services/engine/toast.service';
import { finalize } from 'rxjs';
import { LoaderService } from '../../../../services/engine/loader.service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn implements OnInit {
  loading = false;
  error = '';
  ip: string = '12';
  signInForm: FormGroup;
  showPassword = false;

  constructor(private fb: FormBuilder,
    private router: Router,
    private authService: AuthServices,
    private cdr: ChangeDetectorRef,
    private localStorageEngine: StorageEngine,
    private toast: ToastService,
    private loader: LoaderService
  ) {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  ngOnInit(): void {
    this.authService.getIp().subscribe({
      next: (res) => {
        this.ip = res;
        console.log(this.ip);
      },
      error(err) {
        console.log('Failed to get IP', err);
      },
    })
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }




  onSubmit() {
    // if (this.signInForm.valid) {
    //   console.log('Sign In Form Data:', this.signInForm.value);
    //   // Add your authentication logic here
    // } else {
    //   Object.keys(this.signInForm.controls).forEach(key => {
    //     this.signInForm.get(key)?.markAsTouched();
    //   });
    // }


    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.loader.show();
    this.error = '';

    this.authService.login({
      email: this.signInForm.value.email,
      password: this.signInForm.value.password,
      login_ip: '12'
    }).pipe(
      finalize(() => {
        this.loading = false;           // reset loading
        this.loader.hide();            // hide loader
        this.cdr.detectChanges();       // optional, forces template update
      })
    ).subscribe({
      next: (res: LoginResponce<Datas>) => {
        this.loading = false;
        this.localStorageEngine.setAccessToken(res.data.access_token ?? "");
        this.localStorageEngine.setRefreshToken(res.data.refresh_token ?? "");
        this.toast.success(res.message || 'Login successful!');

        // console.log('Login Success',res);
        setTimeout(() => {
          this.loader.hide();
          this.router.navigate(['/home'], { replaceUrl: true });
        }, 2000);

      },
      error: (err) => {
        this.loading = false;
        this.loader.hide();
        this.error = err.error?.message ?? 'Invalid email or password';
        this.toast.error(this.error);
        console.error('Login failed', err);
        this.cdr.detectChanges();
      }
    })

  }

  get email() {
    return this.signInForm.get('email');
  }

  get password() {
    return this.signInForm.get('password');
  }
}