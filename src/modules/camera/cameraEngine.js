/**
 * cameraEngine.js - Manages device media streams, lens selection, geometric slicing, and filter baking.
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
    // 1. Fully stop and release previous sensor
    this.stop();
    this.facingMode = preferredFacingMode;

    // 2. Hardware cooldown buffer: gives Android HAL time to release the lens
    await new Promise((resolve) => setTimeout(resolve, 180));

    // 3. Flexible resolution constraints: front selfie lenses need more relaxed bounds
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
    } catch (primaryErr) {
      console.warn(`High-res stream rejected for ${this.facingMode}, attempting minimal fallback:`, primaryErr);
      
      // Fallback: minimal constraints without fixed resolution boundaries
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: this.facingMode } }
      });
    }

    this.video.srcObject = this.stream;
    this.activeTrack = this.stream.getVideoTracks()[0];

    return new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        resolve(this.activeTrack.getSettings());
      };
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
