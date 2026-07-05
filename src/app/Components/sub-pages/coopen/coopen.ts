import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderRequest } from '../../../../interfaces/subscriptions_interface';
import { SubscriptionService } from '../../main-pages/subscriptions/subscription.service';
import { LoaderService } from '../../../../services/engine/loader.service';

declare var Razorpay: any;

@Component({
  selector: 'app-coopen',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './coopen.html',
  styleUrl: './coopen.scss',
})
export class Coopen {
  service = inject(SubscriptionService);
  loading = inject(LoaderService);

  @Input() plan!: any;

  couponCode = '';

  discount = 0;
  discountType: string = ''; // 'percentage' | 'flat'
  discountValue = 0;
  tax = 0;
  total = 0;

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

      this.calculateTotal();
      this.loading.hide();
    },
    error: (err) => {
      console.log(err);
      alert('Invalid coupon code');
      this.loading.hide();
    }
  });
}

  calculateTotal() {
    const amount = Number(this.plan.amount);
    this.total = amount - this.discount;
  }

  order: any = [];

  payNow() {
    this.loading.show();

    const payload: OrderRequest = {
      amount: String(this.total),
      tag: 'course',
      plan_id:this.plan.id
    };

    this.service.getOrder(payload).subscribe({
      next: (res) => {
        this.loading.hide();

        if (res.status) {
          this.order = res.data;

          const options: any = {
            key: res.data.apiKey,
            amount: res.data.amount,
            currency: 'INR',
            name: 'Acme Corp',
            description: res.data.receipt,
            order_id: res.data.orderId,
            prefill: {
              name: 'Surendhar',
              email: 'surendhar@gmail.com',
              contact: '9876543210'
            },
            notes: {
              address: 'Chennai'
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