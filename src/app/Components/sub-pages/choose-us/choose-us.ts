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
      title: 'Comprehensive Curriculum',
      description: 'From Basics to Mastery​We specialize in Smart Money Concepts (SMC), guiding you through the exact strategies used by institutional banks.',
      image: 'assets/images/Comprehensive Curriculum.jpg.jpeg'
    },
    {
      number: '02',
      title: 'Expert Mentorship',
      description: 'Say goodbye to boring, long lectures! We value your time and engagement.',
      image: 'assets/images/Real-World Trading Floor Experience.jpg.jpeg'

    },
    {
      number: '03',
      title: ' Real-World Trading Floor Experience',
      description: "​We don’t just teach; we provide a space for you to grow.Trading Floor Access: You have the exclusive option to use our professional trading floor.",
      image: 'assets/images/Data-Driven Performance Tracking.jpg.jpeg'
    },
    {
      number: '04',
      title: ' Data-Driven Performance Tracking',
      description: 'To become a pro, you must track like a pro.​Trading Journal Software: We provide premium journaling software to all our students.',
       image: 'assets/images/Expert Mentorship.jpg (1).jpeg'
    },
    // {
    //   number: '05',
    //   title: ' Ultimate Flexibility',
    //   description: "​Your schedule shouldn't stop your success.​Learn Anywhere: There is no requirement to be physically present. Complete the entire course through our video modules at your own convenience.One-on-One Support: If you encounter any doubts or need extra clarity, you can schedule 1-on-1 sessions with our mentors to ensure no question goes unanswered.​Don't just learn to trade—learn to trade like the 1%.Join us today and start your journey toward becoming a Funded Trader!"
    // }
  ];

 showFullText = false;

toggleText() {
  this.showFullText = !this.showFullText;
}
}
