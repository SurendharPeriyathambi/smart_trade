import {
  Component,
  OnDestroy,
  QueryList,
  ViewChildren,
  ElementRef,
  inject,
  ViewEncapsulation,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { AuthStateService } from '../../main-pages/login/auth-state.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, Footer],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
  encapsulation: ViewEncapsulation.None
})
export class ForgotPassword implements OnDestroy {

  @ViewChildren('otpBox') otpBoxes!: QueryList<ElementRef<HTMLInputElement>>;

  private fb       = inject(FormBuilder);
  private router   = inject(Router);
  private cdr   = inject(ChangeDetectorRef);  // ← only this needed, removed cdr
  private authState = inject(AuthStateService);

 get isLoading() { return this.authState.loading(); }
  currentStep         = 1;

  otpError            = '';
  showPassword        = false;
  showConfirmPassword = false;
  resendCooldown      = 0;
  private resendTimer: any;

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  otpControls: FormControl[] = [
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)])
  ];

  otpForm = new FormGroup({
    d0: this.otpControls[0],
    d1: this.otpControls[1],
    d2: this.otpControls[2],
    d3: this.otpControls[3]
  });

  passwordForm = this.fb.group(
    {
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordMatchValidator }
  );

  get emailCtrl()     { return this.emailForm.get('email'); }
  get newPwCtrl()     { return this.passwordForm.get('newPassword'); }
  get confirmPwCtrl() { return this.passwordForm.get('confirmPassword'); }

  // ── Step 1 ────────────────────────────────────────────────────────────────
 sendOtp() {
  if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
 

  this.authState.sendForgotOtp(
      this.emailForm.value.email!,
      () => {
        // onSuccess callback — runs only when API returns 200
        this.currentStep = 2;
        this._startResendCooldown();
        setTimeout(() => this.otpBoxes.first?.nativeElement.focus(), 50);
        this.cdr.detectChanges();
      }
    );
}

verifyOtp() {
  if (this.otpForm.invalid) { this.otpError = 'Please enter all 4 digits.'; return; }
  this.otpError  = '';
  // this.isLoading = true;
const otp = Number(this.otpControls.map(c => c.value).join(''));

    this.authState.verifyForgotOtp(
      this.emailForm.value.email!,
      otp,
      () => {
        this.currentStep = 3;
        this.cdr.detectChanges();
      }
    );

 
}

submitNewPassword() {
  if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
  // this.isLoading = true;
   this.authState.changeForgotPassword(
      this.emailForm.value.email!,
      this.passwordForm.value.newPassword!
      // no callback needed — state service navigates to /login on success
    );
}

  // ── Step 2 ────────────────────────────────────────────────────────────────
 
  resendOtp() {
    if (this.resendCooldown > 0) return;
    this._startResendCooldown();
    this.otpControls.forEach(c => c.setValue(''));
     this.sendOtp();
  }

  // ── Step 3 ────────────────────────────────────────────────────────────────
 
  // ── OTP keyboard ──────────────────────────────────────────────────────────
  onOtpKeyup(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.value && index < 3) {
      this.otpBoxes.toArray()[index + 1].nativeElement.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpControls[index].value && index > 0) {
      this.otpBoxes.toArray()[index - 1].nativeElement.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') ?? '')
      .replace(/\D/g, '').slice(0, 4).split('');
    digits.forEach((d, i) => this.otpControls[i]?.setValue(d));
    const lastIdx = Math.min(digits.length, 3);
    setTimeout(() => this.otpBoxes.toArray()[lastIdx]?.nativeElement.focus(), 0);
  }

  goBack() { this.router.navigate(['/login']); }

  private _startResendCooldown(seconds = 30) {
    clearInterval(this.resendTimer);
    this.resendCooldown = seconds;
    this.resendTimer = setInterval(() => {
      if (--this.resendCooldown <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }

  ngOnDestroy() { clearInterval(this.resendTimer); }
}