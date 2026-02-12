import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-course-curriculam',
  imports: [CommonModule],
  templateUrl: './course-curriculam.html',
  styleUrl: './course-curriculam.scss',
})
export class CourseCurriculam {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
  previewOpen = false;
  videoPlayerOpen = false;

  openPreview() {
    this.previewOpen = true;
  }

  closePreview() {
    this.previewOpen = false;
  }

  openVideoPlayer() {
    this.videoPlayerOpen = true;
    this.previewOpen = false; // Close the preview card when video opens
  }

  closeVideoPlayer() {
    this.videoPlayerOpen = false;
    // Pause the video when closing
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
    }
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

  toggle(section: any) {
    section.expanded = !section.expanded;
  }
}