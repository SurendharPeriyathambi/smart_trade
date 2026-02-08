import { Component } from '@angular/core';
import { Header } from "../../sub-pages/header/header";
import { SubscriptionSummary } from "../../sub-pages/subscription-summary/subscription-summary";
import { SubscriptionPlans } from "../../sub-pages/subscription-plans/subscription-plans";
import { PaymentSection } from "../../sub-pages/payment-section/payment-section";
import { Footer } from "../../sub-pages/footer/footer";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscriptions',
  imports: [Header, SubscriptionSummary, SubscriptionPlans, PaymentSection, Footer,CommonModule],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
})
export class Subscriptions {



 selectedPlan: any = null;       // Plan user picked from the plans list
  activePlan: any = null;         // Plan that becomes active AFTER payment is done

  // Called when user clicks "Choose" on a plan card
  onPlanSelected(plan: any) {
    this.selectedPlan = plan;
  }

  // Called when user clicks "Done" in payment section (after uploading receipt)
  onPaymentDone(plan: any) {
    this.activePlan = plan;       // Now the subscription card gets populated
    this.selectedPlan = null;     // Hide the payment section
  }
}
