import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-subscription-summary',
  imports: [CommonModule],
  templateUrl: './subscription-summary.html',
  styleUrl: './subscription-summary.scss',
})
export class SubscriptionSummary {
 // Receives the active plan from parent ONLY after payment is done
  @Input() activePlan: any = null;

  userProfile = {
    name: 'Charlene Reed',
    email: 'Charlenereede@Gmail.Com',
    startDate: 'Dec 25, 2025',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
  };

  // Dynamically build subscription details from the active plan
  get subscription() {
    if (!this.activePlan) return null;

    const startDate = new Date();
    const renewDate = new Date();
    renewDate.setMonth(renewDate.getMonth() + 1); // 1 month from now

    return {
      plan: this.activePlan.name + ' Plan',
      status: 'Active',
      duration: '1 Month',
      price: '₹' + this.activePlan.price + '/Mo',
      startDate: this.formatDate(startDate),
      renewDate: this.formatDate(renewDate)
    };
  }

  // Helper to format date like "Dec 25, 2025"
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  onUpdate() {
    console.log('Update profile clicked');
    alert('Profile update functionality');
  }
}
