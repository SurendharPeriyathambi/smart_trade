import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscription-plans',
  imports: [CommonModule,FormsModule],
  templateUrl: './subscription-plans.html',
  styleUrl: './subscription-plans.scss',
})
export class SubscriptionPlans {

  @Output() planSelected = new EventEmitter<any>();
  isMonthly = true;
  selectedPlan: any = null;

  plans = [
    {
      type: 'basic',
      name: 'Basic',
      price: 999,
      description: 'Perfect for beginners starting trading',
      features: [
        'All beginner courses',
        'Recorded video access',
        'Basic risk management',
        'Community access'
      ]
    },
    {
      type: 'pro',
      name: 'Pro',
      price: 1999,
      description: 'Advanced tools for serious traders',
      features: [
        'All courses included',
        'Strategy modules',
        'Trade breakdown videos',
        'Psychology training',
        'Priority support'
      ]
    },
    {
      type: 'premium',
      name: 'Premium',
      price: 2999,
      description: 'Complete trading ecosystem',
      features: [
        'Everything in Pro',
        'Advanced strategy content',
        'Live session recordings',
        'Case studies & reviews',
        'Multi-user access'
      ]
    }
  ];

  selectPlan(plan: any) {
    this.planSelected.emit(plan);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
