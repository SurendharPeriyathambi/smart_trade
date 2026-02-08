import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-how-its',
  imports: [CommonModule],
  templateUrl: './how-its.html',
  styleUrl: './how-its.scss',
})
export class HowIts {
 steps = [
    {
      number: 1,
      title: 'Create Account',
      description: 'Sign up and access the learning dashboard.',
      icon: 'account',
      position: 'left'
    },
    {
      number: 2,
      title: 'Choose Your Plan',
      description: 'Pick a plan based on your experience level.',
      icon: 'plan',
      position: 'center'
    },
    {
      number: 3,
      title: 'Learn with Structure',
      description: 'Watch recorded lessons, examples, and trade breakdowns.',
      icon: 'learn',
      position: 'right'
    }
  ];
}
