import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-choose-us',
  imports: [CommonModule],
  templateUrl: './choose-us.html',
  styleUrl: './choose-us.scss',
})
export class ChooseUs {
 features = [
    {
      number: '01',
      title: 'Flexible by Design',
      description: 'Learn anything that caters to your learning style. Each course is structured to fit your pace and preferences.'
    },
    {
      number: '02',
      title: 'Top-Rated Instructors',
      description: 'World-renowned experts deliver in-depth knowledge that will guide your learning journey effectively.'
    },
    {
      number: '03',
      title: 'Track Your Progress',
      description: 'Experience real-time tracking tools. See your growth and celebrate milestones along your learning journey.'
    },
    {
      number: '04',
      title: 'Recognized Certification',
      description: 'We are committed to validating your expertise. Our recognized certifications are eco-friendly and industry-standard.'
    }
  ];
}
