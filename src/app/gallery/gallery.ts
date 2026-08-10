import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
interface GalleryImage {
  src: string;
  author: string;
  area: string; // matches grid-template-area name
}
@Component({
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class Gallery {
 images: GalleryImage[] = [
    { src: 'https://picsum.photos/seed/woman/600/900', author: 'Александр Иванов', area: 'woman'  },
    { src: 'https://picsum.photos/seed/road/900/500',  author: 'Алексей Покаянов', area: 'road'   },
    { src: 'https://picsum.photos/seed/girl/500/500', author: 'Ромина Морено',   area: 'girl'   },
    { src: 'https://picsum.photos/seed/bridge/600/900', author: 'Александр Иванов', area: 'bridge' },
    { src: 'https://picsum.photos/seed/bear/500/500',  author: 'Ларин Андрей',    area: 'bear'   },
    { src: 'https://picsum.photos/seed/car/500/500',  author: 'Кулаков Дмитрий',  area: 'car'    }
  ];
 
  activeImage: GalleryImage | null = null;
 
  open(image: GalleryImage): void {
    this.activeImage = image;
  }
 
  close(): void {
    this.activeImage = null;
  }
 
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
