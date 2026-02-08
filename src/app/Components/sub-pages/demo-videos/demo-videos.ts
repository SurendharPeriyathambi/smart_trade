import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
interface Video {
  id: number;
  title: string;
  thumbnail: string;
}

@Component({
  selector: 'app-demo-videos',
  imports: [CommonModule],
  templateUrl: './demo-videos.html',
  styleUrl: './demo-videos.scss',
})
export class DemoVideos {
videos = [
  {
    title: 'Big Buck Bunny',
    thumbnail: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    title: 'Flower Video',
    thumbnail: 'https://via.placeholder.com/300x200.png?text=Flower+Video',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    title: 'Flower Video',
    thumbnail: 'https://via.placeholder.com/300x200.png?text=Flower+Video',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    title: 'Water Stream',
    thumbnail: 'https://via.placeholder.com/300x200.png?text=Water+Stream',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/stream-of-water.mp4',
  }
];


  activeVideo: any = null;

  openVideo(video: any) {
    this.activeVideo = video;
  }

  closeVideo() {
    this.activeVideo = null;
  }
}
