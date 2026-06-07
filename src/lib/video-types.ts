export type FPS = 24 | 30 | 48 | 60 | 120;
export type ResolutionKey = "1080p" | "2k" | "4k";
export type Codec = "h264" | "h265";
export type QualityPreset = "fast" | "balanced" | "high";
export type PhotoDuration = 0.1 | 0.25 | 0.5 | 1 | 2 | 3 | 5;

export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  width: number;
  height: number;
  size: number;
}

export interface VideoSettings {
  fps: FPS;
  resolution: ResolutionKey;
  codec: Codec;
  quality: QualityPreset;
  photoDuration: PhotoDuration;
  filename: string;
}

export const RESOLUTIONS: Record<ResolutionKey, { w: number; h: number; label: string }> = {
  "1080p": { w: 1920, h: 1080, label: "1080p (1920×1080)" },
  "2k": { w: 2560, h: 1440, label: "2K (2560×1440)" },
  "4k": { w: 3840, h: 2160, label: "4K (3840×2160)" },
};

export const DEFAULT_SETTINGS: VideoSettings = {
  fps: 30,
  resolution: "1080p",
  codec: "h264",
  quality: "balanced",
  photoDuration: 1,
  filename: "output.mp4",
};

export const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export const MAX_IMAGES = 500;
