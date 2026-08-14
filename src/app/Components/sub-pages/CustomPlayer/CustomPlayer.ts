import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    Output,
    ViewChild
} from '@angular/core';

import {
    load
} from '@kinescope/player-iframe-api-loader';

export interface VideoPlayerData {
    currentTime: number;
    duration: number;
    percent: number;
    watermarkLabel: string;
    videoUrl: string;
}

@Component({
    selector: 'app-custom-player',
    standalone: true,
    templateUrl: './CustomPlayer.html',
    styleUrl: './CustomPlayer.scss'
})
export class CustomPlayer

    implements AfterViewInit, OnDestroy {

        
    @ViewChild('playerContainer', {
        static: true
    })
    playerContainer!: ElementRef<HTMLDivElement>;

    @ViewChild('playerElement', {
        static: true
    })
    playerElement!: ElementRef<HTMLDivElement>;

    // --------------------------------------------------
    // INPUTS
    // --------------------------------------------------

    @Input({ required: true })
    videoUrl!: string;

    @Input()
    watermarkLabel = '';

    /**
     * Start position in seconds.
     *
     * 600 = 10 minutes
     */
    @Input()
    startTime = 0;

    /**
     * End position in seconds.
     *
     * 1800 = 30 minutes.
     *
     * 0 = no limit.
     */
    @Input()
    endTime = 0;

    // --------------------------------------------------
    // OUTPUTS
    // --------------------------------------------------

    @Output()
    videoPaused =
        new EventEmitter<VideoPlayerData>();

    @Output()
    videoClosed =
        new EventEmitter<VideoPlayerData>();

    @Output()
    videoEnded =
        new EventEmitter<VideoPlayerData>();

    // --------------------------------------------------
    // PLAYER
    // --------------------------------------------------

    private player: any = null;

    private destroyed = false;

    private playerInitialized = false;

    private lastCurrentTime = 0;

    private lastDuration = 0;

    // --------------------------------------------------
    // INIT
    // --------------------------------------------------

    async ngAfterViewInit(): Promise<void> {
        await this.initializePlayer();
    }

    // --------------------------------------------------
    // INITIALIZE KINESCOPE
    // --------------------------------------------------

    private async initializePlayer(): Promise<void> {

        try {

            console.log(
                'Loading Kinescope IFrame API...'
            );

            const playerFactory =
                await load();

            if (this.destroyed) {
                return;
            }

            console.log(
                'Kinescope API loaded'
            );

            /**
             * Create player inside our div.
             *
             * Kinescope will create the iframe
             * automatically.
             */
            this.player =
                await playerFactory.create(
                    this.playerElement.nativeElement,
                    {
                        url: this.videoUrl,

                        size: {
                            width: '100%',
                            height: '100%'
                        },

                        behavior: {
                            autoPlay: false,
                            muted: false,
                            loop: false,
                            keyboard: true,
                            playsInline: true
                        },
                        ui: {
                            controls: true,
                            mainPlayButton: true,

                            watermark: {
                                text: this.watermarkLabel,
                                mode: 'random',
                                scale: 0.1,
                                displayTimeout: {
                                    visible: 5000,
                                    hidden: 3000
                                }
                            }
                        },
                        theme: {
                            watermark: {
                                default: {
                                    color: "rgba(255, 255, 255, 0.6)"
                                }
                            },
                            colors: {
                                primary: "#1e32ea"
                            }
                        }
                    }
                );

            if (this.destroyed) {
                return;
            }

            this.playerInitialized = true;

            console.log(
                'Kinescope player created',
                this.player
            );

            this.registerEvents();

            await this.loadPlayerInformation();

            await this.setInitialPosition();

        } catch (error) {

            console.error(
                'Kinescope player initialization failed:',
                error
            );
        }
    }

    // --------------------------------------------------
    // EVENTS
    // --------------------------------------------------

    private registerEvents(): void {

        if (!this.player) {
            return;
        }

        /**
         * PLAY
         */
        this.player.on(
            this.player.Events.Play,
            () => {

                console.log(
                    '========== VIDEO PLAY =========='
                );

            }
        );

        /**
         * PAUSE
         *
         * This is the important part.
         */
        this.player.on(
            this.player.Events.Pause,
            async () => {

                console.log(
                    '========== VIDEO PAUSED =========='
                );

                await this.updatePlayerPosition();

                const data =
                    this.getPlayerData();

                console.log(
                    'Pause data:',
                    data
                );

                this.videoPaused.emit(
                    data
                );
            }
        );

        /**
         * TIME UPDATE
         */
        this.player.on(
            this.player.Events.TimeUpdate,
            (event: any) => {

                const data =
                    event?.data;

                if (!data) {
                    return;
                }

                if (
                    typeof data.currentTime ===
                    'number'
                ) {

                    this.lastCurrentTime =
                        data.currentTime;
                }

                if (
                    typeof data.duration ===
                    'number'
                ) {

                    this.lastDuration =
                        data.duration;
                }

                /**
                 * Check our custom end time.
                 */
                this.checkEndTime();
            }
        );

        /**
         * ENDED
         */
        this.player.on(
            this.player.Events.Ended,
            async () => {

                console.log(
                    '========== VIDEO ENDED =========='
                );

                await this.updatePlayerPosition();

                this.videoEnded.emit(
                    this.getPlayerData()
                );
            }
        );

        /**
         * ERROR
         */
        this.player.on(
            this.player.Events.Error,
            (event: any) => {

                console.error(
                    'Kinescope player error:',
                    event
                );
            }
        );
    }

    // --------------------------------------------------
    // PLAYER INFORMATION
    // --------------------------------------------------

    private async loadPlayerInformation():
        Promise<void> {

        if (!this.player) {
            return;
        }

        try {

            const duration =
                await this.player.getDuration();

            if (
                typeof duration === 'number'
            ) {

                this.lastDuration =
                    duration;
            }

            console.log(
                'Video duration:',
                this.lastDuration
            );

        } catch (error) {

            console.error(
                'Could not get duration:',
                error
            );
        }
    }

    // --------------------------------------------------
    // INITIAL POSITION
    // --------------------------------------------------

    private async setInitialPosition():
        Promise<void> {

        if (!this.player) {
            return;
        }

        if (this.startTime < 0) {
            return;
        }

        try {

            console.log(
                'Setting start position:',
                this.startTime
            );

            await this.player.seekTo(
                this.startTime
            );

            this.lastCurrentTime =
                this.startTime;

        } catch (error) {

            console.error(
                'Could not set start position:',
                error
            );
        }
    }

    // --------------------------------------------------
    // GET CURRENT POSITION
    // --------------------------------------------------

    private async updatePlayerPosition():
        Promise<void> {

        if (!this.player) {
            return;
        }

        try {

            const currentTime =
                await this.player.getCurrentTime();

            if (
                typeof currentTime === 'number'
            ) {

                this.lastCurrentTime =
                    currentTime;
            }

            const duration =
                await this.player.getDuration();

            if (
                typeof duration === 'number'
            ) {

                this.lastDuration =
                    duration;
            }

            console.log(
                'Current time:',
                this.lastCurrentTime
            );

            console.log(
                'Duration:',
                this.lastDuration
            );

        } catch (error) {

            console.error(
                'Could not get player position:',
                error
            );
        }
    }

    // --------------------------------------------------
    // PLAY
    // --------------------------------------------------

    async play(): Promise<void> {

        if (!this.player) {
            return;
        }

        try {

            await this.player.play();

        } catch (error) {

            console.error(
                'Play failed:',
                error
            );
        }
    }

    // --------------------------------------------------
    // PAUSE
    // --------------------------------------------------

    async pausePlayer(): Promise<void> {

        if (!this.player) {
            return;
        }

        try {

            await this.player.pause();

        } catch (error) {

            console.error(
                'Pause failed:',
                error
            );
        }
    }

    // --------------------------------------------------
    // SEEK
    // --------------------------------------------------

    async seek(
        seconds: number
    ): Promise<void> {

        if (!this.player) {
            return;
        }

        let target =
            Math.max(0, seconds);

        /**
         * Don't allow going beyond
         * configured end time.
         */
        if (
            this.endTime > 0 &&
            target > this.endTime
        ) {

            target =
                this.endTime;
        }

        try {

            await this.player.seekTo(
                target
            );

            this.lastCurrentTime =
                target;

        } catch (error) {

            console.error(
                'Seek failed:',
                error
            );
        }
    }

    // --------------------------------------------------
    // FORWARD
    // --------------------------------------------------

    async seekForward(
        seconds = 600
    ): Promise<void> {

        await this.updatePlayerPosition();

        const target =
            this.lastCurrentTime +
            seconds;

        await this.seek(target);
    }

    // --------------------------------------------------
    // BACKWARD
    // --------------------------------------------------

    async seekBackward(
        seconds = 600
    ): Promise<void> {

        await this.updatePlayerPosition();

        const target =
            this.lastCurrentTime -
            seconds;

        await this.seek(target);
    }

    // --------------------------------------------------
    // END TIME
    // --------------------------------------------------

    private async checkEndTime(): Promise<void> {

        if (this.endTime <= 0) {
            return;
        }

        if (
            this.lastCurrentTime >=
            this.endTime
        ) {

            console.log(
                'Reached end time:',
                this.endTime
            );

            await this.seek(
                this.endTime
            );

            await this.pausePlayer();
        }
    }

    // --------------------------------------------------
    // GET DATA
    // --------------------------------------------------

    private getPlayerData():
        VideoPlayerData {

        const duration =
            this.lastDuration;

        const currentTime =
            this.lastCurrentTime;

        const percent =
            duration > 0
                ? (
                    currentTime /
                    duration
                ) * 100
                : 0;

        return {

            currentTime,

            duration,

            percent,

            watermarkLabel:
                this.watermarkLabel,

            videoUrl:
                this.videoUrl
        };
    }

    // --------------------------------------------------
    // CLOSE
    // --------------------------------------------------

    async close(): Promise<void> {

        if (!this.player) {

            this.videoClosed.emit(
                this.getPlayerData()
            );

            return;
        }

        try {

            /**
             * Get the exact current
             * position before closing.
             */
            await this.updatePlayerPosition();

        } catch (error) {

            console.error(
                'Could not update position:',
                error
            );
        }

        const data =
            this.getPlayerData();

        console.log(
            '========== VIDEO CLOSED =========='
        );

        console.log(
            data
        );

        /**
         * Tell parent component.
         */
        this.videoClosed.emit(
            data
        );

        /**
         * Pause before destroying.
         */
        try {

            await this.player.pause();

        } catch {
            // Ignore
        }

        /**
         * Destroy Kinescope player.
         */
        try {

            if (
                typeof this.player.destroy ===
                'function'
            ) {

                await this.player.destroy();
            }

        } catch (error) {

            console.error(
                'Player destroy error:',
                error
            );
        }

        this.player = null;

        this.playerInitialized =
            false;
    }

    // --------------------------------------------------
    // FULLSCREEN
    // --------------------------------------------------

    async fullscreen(): Promise<void> {

        try {

            if (
                document.fullscreenElement
            ) {

                await document.exitFullscreen();

                return;
            }

            await this.playerContainer
                .nativeElement
                .requestFullscreen();

        } catch (error) {

            console.error(
                'Fullscreen error:',
                error
            );
        }
    }
    // --------------------------------------------------
    // DESTROY
    // --------------------------------------------------

    async ngOnDestroy(): Promise<void> {

        this.destroyed = true;
        if (this.player) {

            try {

                if (
                    typeof this.player.destroy ===
                    'function'
                ) {

                    await this.player.destroy();
                }

            } catch {
                // Ignore
            }
        }

        this.player = null;
    }
   



}