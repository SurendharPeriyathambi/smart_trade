import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderRequest } from '../../../../interfaces/subscriptions_interface';
import { SubscriptionService } from '../../main-pages/subscriptions/subscription.service';
import { LoaderService } from '../../../../services/engine/loader.service';
import { ToastService } from '../../../../services/engine/toast.service';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';

declare var Razorpay: any;

@Component({
  selector: 'app-coopen',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './coopen.html',
  styleUrl: './coopen.scss',
})
export class Coopen {

  substate = inject(SubscriptionState)
  service = inject(SubscriptionService);
  loading = inject(LoaderService);
  toast = inject(ToastService);
  
  profile =  this.substate.profile;

  @Input() plan!: any;

  couponCode = '';

  discount = 0;
  discountType: string = ''; // 'percentage' | 'flat'
  discountValue = 0;
  tax = 0;
  total = 0;

   couponApplied = false;

  ngOnInit() {
    this.calculateTotal();
  }

  applyCoupon() {
  if (!this.couponCode.trim()) {
    alert('Please enter a coupon code');
    return;
  }

  this.loading.show();

  this.service.getCouponDiscount(this.couponCode).subscribe({
    next: (res) => {
      const amount = Number(this.plan.amount);
      const type = String(res.data.discount_type).trim().toLowerCase();
      const value = Number(res.data.value);

      this.discountType = type;
      this.discountValue = value;

      if (type === 'percentage' || type === 'percent') {
        this.discount = (amount * value) / 100;
      } else if (type === 'flat' || type === 'fixed' || type === 'amount') {
        this.discount = value;
      } else {
        console.warn('Unknown discount_type:', res.data.discount_type);
        this.discount = 0;
      }
      this.couponApplied = true;
      this.calculateTotal();
      this.loading.hide();
    },
    error: (err) => {
      console.log(err);
     
      this.toast.error(err.error.message || "Invalied Coupon ")
      this.loading.hide();
    }
  });
}

 // NEW: local-only removal, no API call
  removeCoupon() {
    this.couponCode = '';
    this.discount = 0;
    this.discountType = '';
    this.discountValue = 0;
    this.couponApplied = false;
    this.calculateTotal();
  }

  calculateTotal() {
    const amount = Number(this.plan.amount);
    const subtotal = Math.max(amount - this.discount, 0);

  // 18% GST
  this.tax = +(subtotal * 0.18).toFixed(2);

  // Final Total
  this.total = +(subtotal + this.tax).toFixed(2)
  }

  order: any = [];

  payNow() {
    this.loading.show();

    const payload: OrderRequest = {
      amount: String(this.total),
      tag: 'course',
      plan_id:this.plan.id,
      code:this.couponCode
    };

    this.service.getOrder(payload).subscribe({
      next: (res) => {
        this.loading.hide();
        this.toast.success(res.message)
        if (res.status) {
          this.order = res.data;
          
          const options: any = {
            key: res.data.apiKey,
            amount: res.data.amount,
            currency: 'INR',
            name: this.plan.plan_name,
            description: res.data.receipt,
            order_id: res.data.orderId,
            prefill: {
              name: this.profile()?.name,
              email: this.profile()?.email,
              contact: this.profile()?.mobile
            },
            notes: {
              address: ''
            },
            modal: {
              ondismiss: () => {
                console.log('Razorpay Closed');
                this.resetBodyScroll();
              }
            },
            handler: (response: any) => {
              console.log('Payment Success');
              console.log(response);
              this.resetBodyScroll();
               window.location.reload();
              // Call Verify Payment API here
            }
          };

          const rzp = new Razorpay(options);

          rzp.on('payment.failed', (response: any) => {
            console.log('Payment Failed');
            console.log(response);
            this.resetBodyScroll();
          });

          rzp.open();
        }
      },
      error: (err) => {
        console.log(err);
         this.toast.error(err.error.message)
        this.loading.hide();
      }
    });
  }

  private resetBodyScroll(): void {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.height = '';
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('modal-open');
    document.body.classList.remove('razorpay-checkout-open');
  }
}