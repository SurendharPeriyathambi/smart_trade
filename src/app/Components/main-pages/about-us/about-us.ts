import { Component, ElementRef, QueryList, ViewChildren, AfterViewInit } from '@angular/core';
import { Header } from '../../sub-pages/header/header';
import { Footer } from '../../sub-pages/footer/footer';

@Component({
  selector: 'app-about-us',
  imports: [Header, Footer],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
})
export class AboutUs implements AfterViewInit {
  @ViewChildren('bioSection') bioSections!: QueryList<ElementRef<HTMLElement>>;

  members = [
    {
      image: 'assets/images/Expert Mentorship.jpg (1).jpeg',
      nameKey: 'Our Esteemed Founder and Expertise',
      contentKeys: [
        'Smart Trade Academy was established by M. Guna, MBA, a visionary leader who brings over a decade of extensive experience in the financial markets. His deep-seated expertise in smart money concepts forms the cornerstone of our advanced educational framework.'
      ]
    },
    {
      image: 'assets/images/Comprehensive Curriculum.jpg.jpeg',
      nameKey: 'Prime Location and Pleasant Environment',
      contentKeys: [
        'Proudly headquartered in the vibrant city of Salem, conveniently located near the New Bus Stand, our premises offer more than just a place of learning. We have cultivated a pleasant, inspiring, and focused environment designed to help you nurture the optimal mindset necessary for consistent trading success.'
      ]
    },
    {
      image: 'assets/images/Real-World Trading Floor Experience.jpg.jpeg',
      nameKey: 'Accessible Learning and Practical Experience',
      contentKeys: [
        'We facilitate a seamless educational journey by providing visually engaging, digital course materials and videos accessible from anywhere. Taking learning a step further, we feature a unique "Trading Floor" concept that allows students to engage in live trading alongside our experienced staff, helping to alleviate anxiety and build confidence through hands-on support.'
      ]
    },
    {
      image: 'assets/images/Data-Driven Performance Tracking.jpg.jpeg',
      nameKey: 'Community and Advanced Tools',
      contentKeys: [
        'We are dedicated to your holistic growth and offer a professional "Traders Club" for networking, community building, and collaborative knowledge sharing. To provide you with an unparalleled edge, we offer exclusive self-examination software for market structure marking, alongside custom trader journaling tools designed to meticulously track your trades and performance.'
      ]
    }
  ];

  isReversed(index: number): boolean {
    return index % 2 !== 0;
  }

  ngAfterViewInit(): void {
    this.bioSections.changes.subscribe(() => {
      this.observeSections();
    });

    setTimeout(() => {
      this.observeSections();
    }, 200);
  }

  private observeSections(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    this.bioSections.forEach(section => {
      if (!section.nativeElement.classList.contains('animate-in')) {
        observer.observe(section.nativeElement);
      }
    });
  }
}