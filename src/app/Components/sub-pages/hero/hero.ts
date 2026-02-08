import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
 stats = [
    { count: '1000+', label: 'Courses to choose from' },
    { count: '5000+', label: 'Students Trained' },
    { count: '200+', label: 'Professional Trainers' }
  ];
}
