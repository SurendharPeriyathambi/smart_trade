import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { RouterModule ,Router} from '@angular/router';
import { StorageEngine } from '../../../../services/engine/storage_engine';
@Component({
  selector: 'app-popular-course',
  imports: [CommonModule,RouterModule],
  templateUrl: './popular-course.html',
  styleUrl: './popular-course.scss',
})
export default class PopularCourse {
  constructor(
  private router: Router,
  private storage: StorageEngine
) {}
  courses = [
    {
      title: 'Market Structure',
      desc: 'Learn product management fundamentals from industry experts.',
      lessons: 5
    },
    {
      title: 'Break of Structure (BOS)',
      desc: 'Master customer platform strategy and execution.',
      lessons: 8
    },
    {
      title: 'Change of Character (CHoCH)',
      desc: 'Understand KPIs, analytics, and growth levers.',
      lessons: 6
    },
    {
       title: 'Internal vs External Structure'
    },
    {
        title: 'Liquidity'
    },
    {
        title: 'Equal Highs and Equal Lows'
    },
    {
        title: 'Liquidity Sweeps (Grabs)'
    },
    {
        title: 'Fair Value Gaps (FVGs)'
    },
    {
        title: 'Order Blocks'
    },
  ];


viewDetails() {
  const isLoggedIn = !!this.storage.getAccessToken();

  if (isLoggedIn) {
    this.router.navigate(['/subscriptions']);
  } else {
    this.router.navigate(['/login']);
  }
}

}

