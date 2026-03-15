import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';
import { SubscriptionList } from '../../../../interfaces/subscriptions_interface';

@Component({
  selector: 'app-subscription-plans',
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-plans.html',
  styleUrl: './subscription-plans.scss',
})
export class SubscriptionPlans {
  @Input() isPending: boolean = false;
  @Output() planSelected = new EventEmitter<any>();

  private subState = inject(SubscriptionState);

  // ✅ Updated signal name from our refactor
  plans = this.subState.plans;

  selectPlan(plan: SubscriptionList) {
    this.planSelected.emit(plan);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }

  getPlanClass(planName: string): string {
    const knownPlans = ['Elite', 'pro', 'premium'];
    return knownPlans.includes(planName) ? planName : 'Elite';
  }
}