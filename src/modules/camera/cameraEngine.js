/**
 * cameraEngine.js - Resilient hardware camera streamer with watchdog timeout.
 */
export class CameraEngine {
  constructor(videoElement) {
    this.video = videoElement;
    this.stream = null;
    this.activeTrack = null;
    this.facingMode = 'environment';
    this.currentRatio = { widthRatio: 3, heightRatio: 4 };
    this.activeFilter = 'none';
  }

  async start(preferredFacingMode = this.facingMode) {
    this.stop();
    this.facingMode = preferredFacingMode;

    // Give Android HAL hardware driver time to release previous sensor
    await new Promise((r) => setTimeout(r, 120));

    const isFront = this.facingMode === 'user';
    const primaryConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: isFront ? 1280 : 1920 },
        height: { ideal: isFront ? 720 : 1080 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
    } catch (err) {
      console.warn('Fallback to basic constraints for lens:', this.facingMode, err);
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: this.facingMode } }
      });
    }

    this.video.srcObject = this.stream;
    this.activeTrack = this.stream.getVideoTracks()[0];

    // Safe play routine with timeout so promise NEVER hangs forever
    return new Promise((resolve) => {
      let resolved = false;

      const finish = () => {
        if (!resolved) {
          resolved = true;
          this.video.play().catch(() => {});
          resolve(this.activeTrack ? this.activeTrack.getSettings() : {});
        }
      };

      if (this.video.readyState >= 1) {
        finish();
      } else {
        this.video.onloadedmetadata = finish;
        // Watchdog timeout: unblocks after 1.5s even if event misses
        setTimeout(finish, 1500);
      }
    });
  }

  async flipCamera() {
    const nextFacingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    return await this.start(nextFacingMode);
  }

  setAspectRatio(ratioConfig) {
    this.currentRatio = ratioConfig;
  }

  setFilter(filterString) {
    this.activeFilter = filterString;
  }

  _calculateCrop(videoWidth, videoHeight) {
    const targetRatio = this.currentRatio.widthRatio / this.currentRatio.heightRatio;
    const currentVideoRatio = videoWidth / videoHeight;

    let cropWidth = videoWidth;
    let cropHeight = videoHeight;

    if (currentVideoRatio > targetRatio) {
      cropWidth = Math.round(videoHeight * targetRatio);
    } else {
      cropHeight = Math.round(videoWidth / targetRatio);
    }

    const startX = Math.round((videoWidth - cropWidth) / 2);
    const startY = Math.round((videoHeight - cropHeight) / 2);

    return { startX, startY, cropWidth, cropHeight };
  }

  captureFrameCanvas() {
    if (!this.stream || !this.video.videoWidth) {
      throw new Error('Camera is not active or has no video dimensions.');
    }

    const { videoWidth, videoHeight } = this.video;
    const { startX, startY, cropWidth, cropHeight } = this._calculateCrop(videoWidth, videoHeight);

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    ctx.filter = this.activeFilter;

    if (this.facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      this.video,
      startX, startY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    return canvas;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.activeTrack = null;
      this.video.srcObject = null;
    }
  }
}
