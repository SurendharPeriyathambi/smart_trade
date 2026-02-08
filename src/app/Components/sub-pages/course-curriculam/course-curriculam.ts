import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-course-curriculam',
  imports: [CommonModule],
  templateUrl: './course-curriculam.html',
  styleUrl: './course-curriculam.scss',
})
export class CourseCurriculam {
previewOpen = false;

openPreview() {
  this.previewOpen = true;
}

closePreview() {
  this.previewOpen = false;
}
  sections = [
    {
      title: 'Introduction to Options Foundations',
      lessonsCount: 1,
      duration: '30min',
      expanded: true,
      lessons: [
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true }
      ]
    },
    {
      title: 'Introduction to Options Foundations',
      lessonsCount: 2,
      duration: '30min',
      expanded: false,
      lessons: [
        { title: 'Course overview & learning objects', duration: '5 Mins', preview: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
        { title: 'Course overview & learning objects', duration: '5 Mins', locked: true }
      ]
    }
  ];

// toggle(section: any) {
//   this.sections.forEach(sec => {
//     if (sec !== section) {
//       sec.expanded = false;
//     }
//   });
//   section.expanded = !section.expanded;
// }
toggle(section: any) {
  section.expanded = !section.expanded;
}


}
