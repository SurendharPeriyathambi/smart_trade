import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-popular-course',
  imports: [CommonModule],
  templateUrl: './popular-course.html',
  styleUrl: './popular-course.scss',
})
export class PopularCourse {
 
  courses = [
    {
      title: 'Product Management Basic - Course',
      desc: 'Learn product management fundamentals from industry experts.',
      lessons: 5
    },
    {
      title: 'Product Management Advanced',
      desc: 'Master customer platform strategy and execution.',
      lessons: 8
    },
    {
      title: 'Growth & Metrics for PMs',
      desc: 'Understand KPIs, analytics, and growth levers.',
      lessons: 6
    }
  ];
}
