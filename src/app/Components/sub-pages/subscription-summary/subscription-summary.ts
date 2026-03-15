import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';

@Component({
  selector: 'app-subscription-summary',
  imports: [CommonModule],
  templateUrl: './subscription-summary.html',
  styleUrl: './subscription-summary.scss',
})
export class SubscriptionSummary {

  private subState = inject(SubscriptionState);

  // ✅ Directly from state — no @Input needed
  profile = this.subState.profile;
  subscription = this.subState.subscription;
  subscriptionStatus = this.subState.subscriptionStatus;
}