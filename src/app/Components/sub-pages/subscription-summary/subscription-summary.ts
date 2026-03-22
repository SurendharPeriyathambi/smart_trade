import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input } from '@angular/core';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';

@Component({
  selector: 'app-subscription-summary',
  imports: [CommonModule],
  templateUrl: './subscription-summary.html',
  styleUrl: './subscription-summary.scss',
})
export class SubscriptionSummary {

  private subState = inject(SubscriptionState);

  //    Directly from state — no @Input needed
  profile = this.subState.profile;
  subscription = this.subState.subscription;
  subscriptionStatus = this.subState.subscriptionStatus;


   remainingDays = computed(() => {
    const endDate = this.subscription()?.end_date;
    if (!endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  });
}

