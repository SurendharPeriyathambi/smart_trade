import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  signal,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as iframeApiLoader from '@kinescope/player-iframe-api-loader';

export interface VideoDetails {
  videoId: string;
  title?: string;
  watermarkText?: string;
}

// ← New: shape of the data emitted to the parent
export interface VideoStatus {
  videoId: string;
  currentTime: number;
  duration: number;
  pauseTime: number;
  progress: number;
  lastEvent: string;
}

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-container.html',
  styleUrl: './video-container.scss',
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() videoDetails!: VideoDetails;
  @Input() isOpen = false;

  @Output() closed = new EventEmitter<void>();

  // ← New outputs
  @Output() statusChange = new EventEmitter<VideoStatus>(); // fires on every meaningful update
  @Output() paused = new EventEmitter<VideoStatus>();       // fires only on pause
  @Output() ended = new EventEmitter<VideoStatus>();        // fires only on ended
  @Output() closedWithStatus = new EventEmitter<VideoStatus>(); // fires on destroy/close, with final position

  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLElement>;
  @ViewChild('kinescopeIframe') kinescopeIframe!: ElementRef<HTMLIFrameElement>;

  private player: any = null;
  private watermarkInterval?: ReturnType<typeof setInterval>;

  currentTime = signal(0);
  duration = signal(0);
  pauseTime = signal(0);
  progress = signal(0);
  lastEvent = signal('');
  isFullscreen = signal(false);
  watermarkTop = signal(20);
  watermarkLeft = signal(20);

  get embedUrl(): string {
    return `https://kinescope.io/embed/${this.videoDetails?.videoId}`;
  }

  // ← Builds the status object from current signal values
  private buildStatus(): VideoStatus {
    return {
      videoId: this.videoDetails?.videoId,
      currentTime: this.currentTime(),
      duration: this.duration(),
      pauseTime: this.pauseTime(),
      progress: this.progress(),
      lastEvent: this.lastEvent(),
    };
  }

  private handleFullscreenChange = (): void => {
    this.isFullscreen.set(document.fullscreenElement === this.videoContainer?.nativeElement);
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoDetails'] && !changes['videoDetails'].firstChange && this.player) {
      this.destroyPlayer();
      this.initPlayer();
    }
  }

  async ngAfterViewInit(): Promise<void> {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    this.moveWatermark();
    this.watermarkInterval = setInterval(() => this.moveWatermark(), 5000);

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await this.initPlayer();
  }

  private async initPlayer(): Promise<void> {
    try {
      const playerFactory = await iframeApiLoader.load();
      const iframe = this.kinescopeIframe.nativeElement;
      iframe.id = 'kinescope-player';

      this.player = await playerFactory.create('kinescope-player', {
        url: this.embedUrl,
      });

      this.setupPlayerEvents();
      await this.loadInitialValues();
    } catch (error) {
      console.error('Kinescope initialization error:', error);
      this.lastEvent.set('initialization-error');
    }
  }

  private setupPlayerEvents(): void {
    if (!this.player) return;

    this.player.on(this.player.Events.Play, () => {
      this.lastEvent.set('play');
      this.statusChange.emit(this.buildStatus());
    });

    if (this.player.Events.Playing) {
      this.player.on(this.player.Events.Playing, () => {
        this.lastEvent.set('playing');
        this.statusChange.emit(this.buildStatus());
      });
    }

    this.player.on(this.player.Events.TimeUpdate, (event: any) => {
      const currentTime = event?.data?.currentTime;
      const percent = event?.data?.percent;

      if (typeof currentTime === 'number') this.currentTime.set(currentTime);
      if (typeof percent === 'number') {
        this.progress.set(percent);
      } else {
        this.updateProgress();
      }
      this.lastEvent.set('timeupdate');

      // Emitting on every timeupdate can be very frequent (multiple times/sec).
      // Only enable this if your parent/API can handle that volume — otherwise
      // rely on 'paused' / 'ended' / 'closedWithStatus' instead.
      // this.statusChange.emit(this.buildStatus());
    });

    this.player.on(this.player.Events.Pause, async () => {
      try {
        const time = Number(await this.player.getCurrentTime()) || 0;
        this.currentTime.set(time);
        this.pauseTime.set(time);
        this.updateProgress();
        this.lastEvent.set('pause');

        const status = this.buildStatus();
        this.paused.emit(status);       // ← emitted here
        this.statusChange.emit(status); // ← and here
      } catch (error) {
        console.error('Pause time error:', error);
      }
    });

    this.player.on(this.player.Events.Ended, async () => {
      try {
        const total = Number(await this.player.getDuration()) || 0;
        this.duration.set(total);
        this.currentTime.set(total);
        this.pauseTime.set(total);
        this.progress.set(100);
        this.lastEvent.set('ended');

        const status = this.buildStatus();
        this.ended.emit(status);        // ← emitted here
        this.statusChange.emit(status);
      } catch (error) {
        console.error('Ended error:', error);
        this.progress.set(100);
        this.lastEvent.set('ended');
        this.ended.emit(this.buildStatus());
      }
    });

    if (this.player.Events.Error) {
      this.player.on(this.player.Events.Error, (event: any) => {
        console.error('KINESCOPE ERROR:', event);
        this.lastEvent.set('error');
        this.statusChange.emit(this.buildStatus());
      });
    }
  }

  private async loadInitialValues(): Promise<void> {
    if (!this.player) return;
    try {
      const duration = await this.player.getDuration();
      const currentTime = await this.player.getCurrentTime();
      this.duration.set(Number(duration) || 0);
      this.currentTime.set(Number(currentTime) || 0);
      this.updateProgress();
      this.lastEvent.set('ready');
    } catch (error) {
      console.error('Initial values error:', error);
    }
  }

  private updateProgress(): void {
    const total = this.duration();
    const current = this.currentTime();
    if (total <= 0) {
      this.progress.set(0);
      return;
    }
    const percentage = (current / total) * 100;
    this.progress.set(Math.min(100, Math.max(0, percentage)));
  }

  private moveWatermark(): void {
    this.watermarkTop.set(Math.floor(Math.random() * 75) + 10);
    this.watermarkLeft.set(Math.floor(Math.random() * 75) + 10);
  }

  fullscreen(): void {
    const element = this.videoContainer?.nativeElement;
    if (!element) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch((error) => console.error('Exit fullscreen failed:', error));
      return;
    }
    element.requestFullscreen().catch((error) => console.error('Fullscreen failed:', error));
  }

  close(): void {
    this.closed.emit();
  }

  private destroyPlayer(): void {
    try {
      if (this.player && typeof this.player.destroy === 'function') {
        this.player.destroy();
      }
    } catch (error) {
      console.error('Destroy player error:', error);
    }
    this.player = null;
  }

  async ngOnDestroy(): Promise<void> {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    if (this.watermarkInterval) clearInterval(this.watermarkInterval);

    try {
      if (this.player && typeof this.player.getCurrentTime === 'function') {
        const time = Number(await this.player.getCurrentTime()) || 0;
        this.currentTime.set(time);
        this.pauseTime.set(time);
      }
    } catch (error) {
      console.error('Destroy time capture error:', error);
    }

    // ← Emit final status on destroy so parent can persist last position
    this.closedWithStatus.emit(this.buildStatus());

    this.destroyPlayer();
  }
}