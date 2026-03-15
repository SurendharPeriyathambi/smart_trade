import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { SubscriptionState } from '../../main-pages/subscriptions/subscription_state.service';
import Hls from 'hls.js';
import { CourseVideo } from '../../../../interfaces/subscriptions_interface';

@Component({
  selector: 'app-course-curriculam',
  imports: [CommonModule],
  templateUrl: './course-curriculam.html',
  styleUrl: './course-curriculam.scss',
})
export class CourseCurriculam {
  // @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  

  private subState = inject(SubscriptionState);

  course = this.subState.course;
  courseLoading = this.subState.courseLoading;
  isVideoModalOpen = this.subState.isVideoModalOpen;
  activeVideoUrl = this.subState.activeVideoUrl;
  videoLoading = this.subState.videoLoading;
  selectedVideo = this.subState.selectedVideo;
  previewOpen = false;
  videoPlayerOpen = false;

  // openPreview() {
  //   this.previewOpen = true;
  // }

  // closePreview() {
  //   this.previewOpen = false;
  // }

  // openVideoPlayer() {
  //   this.videoPlayerOpen = true;
  //   this.previewOpen = false; // Close the preview card when video opens
  // }

  // closeVideoPlayer() {
  //   this.videoPlayerOpen = false;
  //   // Pause the video when closing
  //   if (this.videoPlayer?.nativeElement) {
  //     this.videoPlayer.nativeElement.pause();
  //   }
  // }

  // sections = [
  //   {
  //     title: 'Introduction to Options Foundations',
  //     lessonsCount: 1,
  //     duration: '30min',
  //     expanded: true,
  //     lessons: [
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true }
  //     ]
  //   },
  //   {
  //     title: 'Introduction to Options Foundations',
  //     lessonsCount: 2,
  //     duration: '30min',
  //     expanded: false,
  //     lessons: [
  //       { title: 'Course overview & learning objects', duration: '5 Mins', preview: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true },
  //       { title: 'Course overview & learning objects', duration: '5 Mins', locked: true }
  //     ]
  //   }
  // ];


   expandedLessonId: number | null = null;
   previewVideo: CourseVideo | null = null;
   private hls: Hls | null = null;
  private videoElement!: HTMLVideoElement;

  // toggle(section: any) {
  //   section.expanded = !section.expanded;
  // }

  @ViewChild('videoPlayer') set videoSetter(el: ElementRef<HTMLVideoElement> | undefined) {
  if (el) {
    this.videoElement = el.nativeElement;
    // ✅ if URL already arrived before element was ready, init now
    const url = this.subState.activeVideoUrl();
    if (url) this.initPlayer(url);
  }
}

 constructor() {
  effect(() => {
    const url = this.subState.activeVideoUrl();
    if (url) {
      // ✅ initPlayer when URL arrives — modal already open
      if (this.videoElement) {
        this.initPlayer(url);
      }
    } else {
      this.destroyPlayer();
      this.videoPlayerOpen = false;
    }
  });
}
  toggleLesson(id: number) {
    this.expandedLessonId = this.expandedLessonId === id ? null : id;
  }


  openPreview(video: CourseVideo) {
    this.previewVideo = video;
  }

  closePreview() {
    this.previewVideo = null;
  }


  playVideo(video: CourseVideo) {
    this.previewVideo = null;
    this.videoPlayerOpen = true;
    this.subState.openCourseVideo(video.video, video);
  }

  closeVideo() {
    this.destroyPlayer();
    this.subState.closeCourseVideo();
  }

  private initPlayer(url: string) {
    const video = this.videoElement;
    if (!video) return;

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(url);
      this.hls.attachMedia(video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          this.closeVideo();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play();
    }
  }

  private destroyPlayer() {
    this.hls?.destroy();
    this.hls = null;
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
    }
  }

  // ✅ Convert seconds to minutes display
formatDuration(seconds: string | number): string {
  const secs = Number(seconds);
  if (isNaN(secs)) return '0 min';
  const mins = Math.ceil(secs / 60);
  return `${mins} min`;
}

// ✅ Total duration of all videos in a section (seconds → minutes)
getTotalDuration(videos: CourseVideo[]): string {
  const totalSecs = videos.reduce((sum, v) => sum + Number(v.durations || 0), 0);
  const mins = Math.ceil(totalSecs / 60);
  return `${mins} min`;
}
}