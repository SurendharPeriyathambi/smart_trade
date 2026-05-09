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
      description: 'From Basics to Mastery​We specialize in Smart Money Concepts (SMC), guiding you through the exact strategies used by institutional banks.Foundational Basics: Start from the very beginning of market structure.​Advanced Concepts: Deep dive into liquidity, order blocks, and high-probability entry models.​Expert Mentorship: Learn directly from successful Funded Traders who provide personalized guidance based on real-world results.'
    },
    {
      number: '02',
      title: 'Innovative Learning with High-End Visuals',
      description: '​Say goodbye to boring, long lectures! We value your time and engagement.Graphic-Rich Videos: Our lessons are designed with high-quality graphics and animations to make complex concepts easy to understand.​Optimized Learning: Our visual approach ensures you save time and stay engaged throughout the course, making the learning process fast and effective.'
    },
    {
      number: '03',
      title: ' Real-World Trading Floor Experience',
      description: "​We don’t just teach; we provide a space for you to grow.Trading Floor Access: You have the exclusive option to use our professional trading floor.​Collaborative Trading: You aren't just here to study—you can trade live alongside our experienced traders, gaining insights from their real-time decisions and market analysis"
    },
    {
      number: '04',
      title: ' Data-Driven Performance Tracking',
      description: '​To become a pro, you must track like a pro.​Trading Journal Software: We provide premium journaling software to all our students.​Performance Analytics: Easily track your progress, analyze your win rates, and identify areas for improvement so you always know exactly where you stand in your trading journey.'
    },
    {
      number: '05',
      title: ' Ultimate Flexibility',
      description: "​Your schedule shouldn't stop your success.​Learn Anywhere: There is no requirement to be physically present. Complete the entire course through our video modules at your own convenience.One-on-One Support: If you encounter any doubts or need extra clarity, you can schedule 1-on-1 sessions with our mentors to ensure no question goes unanswered.​Don't just learn to trade—learn to trade like the 1%.Join us today and start your journey toward becoming a Funded Trader!"
    }
  ];
}
