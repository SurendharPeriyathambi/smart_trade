import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../main-pages/subscriptions/subscription.service';
import { SubscriptionState,  } from '../../main-pages/subscriptions/subscription_state.service';
import { Subscription } from '../../../../interfaces/subscriptions_interface';

@Component({
  selector: 'app-subscription-plans',
  imports: [CommonModule,FormsModule],
  templateUrl: './subscription-plans.html',
  styleUrl: './subscription-plans.scss',
})
export class SubscriptionPlans {
 @Input() isPending: boolean = false;
  @Output() planSelected = new EventEmitter<any>();


 
  selectedPlan: Subscription | null = null;

private SubState = inject (SubscriptionState);

plans = this.SubState.subscription;
 
  selectPlan(plan: any) {
    this.planSelected.emit(plan);
   if (typeof window !== 'undefined') {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}
  }

  getPlanClass(planName: string): string {
  const knownPlans = ['Elite', 'pro', 'premium'];
  return knownPlans.includes(planName) ? planName : 'Elite'; // default = Elite
}
}
