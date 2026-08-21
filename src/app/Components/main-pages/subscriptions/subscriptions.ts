import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Header } from "../../sub-pages/header/header";
import { SubscriptionSummary } from "../../sub-pages/subscription-summary/subscription-summary";
import { SubscriptionPlans } from "../../sub-pages/subscription-plans/subscription-plans";
import { Footer } from "../../sub-pages/footer/footer";
import { CommonModule } from '@angular/common';
import { CourseCurriculam } from "../../sub-pages/course-curriculam/course-curriculam";
import { SubscriptionState } from './subscription_state.service';
import { Coopen } from "../../sub-pages/coopen/coopen";
import { ChartList } from '../../chartList/chartlist';

@Component({
  selector: 'app-subscriptions',
  imports: [Header, SubscriptionSummary, SubscriptionPlans,
    Footer, CommonModule, CourseCurriculam, Coopen, ChartList],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
})
export class Subscriptions implements OnInit {

  private subService = inject(SubscriptionState);
  @ViewChild('paymentSectionRef') paymentSectionRef!: ElementRef;

  selectedPlan: any = null;

  subscriptionStatus = this.subService.subscriptionStatus;
  profileLoading = this.subService.profileLoading;

  //   Renewal modal — separate from the new-user selectedPlan flow above,
  // so an active user renewing doesn't collide with the inline plans/payment section
  // (which is hidden for active/approved users anyway).
  showRenewalModal = signal(false);
  renewalSelectedPlan = signal<any | null>(null);

  onPlanSelected(plan: any) {
    this.selectedPlan = plan;
    this.subService.setSelectedPlan(plan.id);
    setTimeout(() => {
      this.paymentSectionRef?.nativeElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }

  onPaymentDone() {
    this.selectedPlan = null;
    this.subService.resetUploadState();
    this.subService.loadUserProfile();
  }

  // ── Renewal modal handlers ──────────────────────────────────────
  openRenewalModal() {
    this.renewalSelectedPlan.set(null);
    this.subService.resetUploadState();
    this.subService.loadPlansForRenewal();
    this.showRenewalModal.set(true);
  }

  closeRenewalModal() {
    this.showRenewalModal.set(false);
    this.renewalSelectedPlan.set(null);
  }

  onRenewalPlanSelected(plan: any) {
    this.renewalSelectedPlan.set(plan);
    this.subService.setSelectedPlan(plan.id);
  }

  onRenewalPaymentDone() {
    this.closeRenewalModal();
    this.subService.resetUploadState();
    this.subService.loadUserProfile();
  }

  ngOnInit(): void {
    this.subService.loadUserProfile();
  }
}