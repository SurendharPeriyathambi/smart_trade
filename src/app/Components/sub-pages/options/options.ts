import { Component } from '@angular/core';

@Component({
  selector: 'app-options',
  imports: [],
  templateUrl: './options.html',
  styleUrl: './options.scss',
})
export class Options {
userProfile = {
    name: 'Charlene Reed',
    email: 'Charlenereede@Gmail.Com',
    startDate: 'Dec 25, 2025',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
  };

  subscription = {
    plan: 'Basic Plan',
    status: 'Active',
    duration: '12 Months',
    price: '₹999/Mo',
    startDate: 'Dec 25, 2025',
    renewDate: '15 Days (Dec 25, 2025)'
  };

  onUpdate() {
    console.log('Update profile clicked');
    alert('Profile update functionality');
  }

}
