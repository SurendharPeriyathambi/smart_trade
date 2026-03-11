import { Component, inject, OnInit } from '@angular/core';
import { Header } from "../../sub-pages/header/header";
import { SubscriptionSummary } from "../../sub-pages/subscription-summary/subscription-summary";
import { SubscriptionPlans } from "../../sub-pages/subscription-plans/subscription-plans";
import { PaymentSection } from "../../sub-pages/payment-section/payment-section";
import { Footer } from "../../sub-pages/footer/footer";
import { CommonModule } from '@angular/common';
import { CourseCurriculam } from "../../sub-pages/course-curriculam/course-curriculam";
import { SubscriptionState } from './subscription_state.service';


@Component({
  selector: 'app-subscriptions',
  imports: [Header, SubscriptionSummary, SubscriptionPlans, PaymentSection, Footer, CommonModule, CourseCurriculam],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
})
export class Subscriptions implements OnInit {

  private subService = inject(SubscriptionState);

  selectedPlan: any = null;      
  activePlan: any = null;         


  subscriptionStatus = this.subService.subscriptionStatus;
  userSubscription = this.subService.currentUserSubscription;


  onPlanSelected(plan: any) {
    this.selectedPlan = plan;
    this.subService.setSelectedPlan(plan.id);
    console.log('Plan selected:', plan);
  }

  // Called when user clicks "Done" in payment section (after uploading receipt)
  onPaymentDone(plan: any) {
    this.activePlan = plan;       // Now the subscription card gets populated
    this.selectedPlan = null;     // Hide the payment section
    console.log('Payment done, activePlan:', plan);   // ← add
    console.log('subscriptionStatus:', this.subscriptionStatus());
  }


  ngOnInit(): void {
    this.subService.getSubscriptionList()

  }




}
