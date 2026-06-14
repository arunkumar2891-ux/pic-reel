import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { UploadedImage, VideoSettings } from "./video-types";
import { RESOLUTIONS } from "./video-types";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

const CORE_VERSION = "0.12.10";
const CDNS = [
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`,
];

async function loadFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));
  let lastErr: unknown;
  for (const base of CDNS) {
    try {
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      ]);
      await ffmpeg.load({ coreURL, wasmURL });
      return ffmpeg;
    } catch (e) {
      lastErr = e;
      console.warn(`FFmpeg load failed from ${base}`, e);
    }
  }
  throw new Error(
    `Failed to load FFmpeg encoder from CDN. ${lastErr instanceof Error ? lastErr.message : ""}`,
  );
}

export async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (!ffmpegLoading) {
    ffmpegLoading = loadFFmpeg(onLog)
      .then((f) => {
        ffmpegInstance = f;
        return f;
      })
      .catch((e) => {
        ffmpegLoading = null;
        throw e;
      });
  }
  return ffmpegLoading;
}

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : ".jpg";
}

export interface RenderProgress {
  step: "preparing" | "rendering" | "encoding" | "finalizing";
  percent: number;
  message: string;
  current?: number;
  total?: number;
}

export interface RenderResult {
  blob: Blob;
  url: string;
  size: number;
}

export async function renderVideo(
  images: UploadedImage[],
  settings: VideoSettings,
  onProgress: (p: RenderProgress) => void,
): Promise<RenderResult> {
  if (images.length === 0) throw new Error("No images to render.");

  const ffmpeg = await getFFmpeg();
  ffmpeg.on("progress", ({ progress }) => {
    const pct = Math.max(0, Math.min(1, progress)) * 100;
    onProgress({
      step: pct >= 99 ? "finalizing" : "encoding",
      percent: 40 + pct * 0.55,
      message: pct >= 99 ? "Finalizing output" : `Encoding video ${pct.toFixed(0)}%`,
    });
  });

  onProgress({ step: "preparing", percent: 5, message: "Preparing images" });

  // Write each image into the FFmpeg virtual filesystem, preserving extension.
  const fileNames: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const ext = extOf(images[i].name);
    const fname = `img_${String(i).padStart(5, "0")}${ext}`;
    await ffmpeg.writeFile(fname, await fetchFile(images[i].file));
    fileNames.push(fname);
    onProgress({
      step: "preparing",
      percent: 5 + ((i + 1) / images.length) * 30,
      message: `Preparing images (${i + 1}/${images.length})`,
      current: i + 1,
      total: images.length,
    });
    // Yield to the event loop so React can flush progress updates.
    if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  // Build concat list with per-image duration.
  const lines: string[] = [];
  for (const f of fileNames) {
    lines.push(`file '${f}'`);
    lines.push(`duration ${settings.photoDuration}`);
  }
  // ffmpeg concat quirk: last file must be repeated without duration.
  lines.push(`file '${fileNames[fileNames.length - 1]}'`);
  await ffmpeg.writeFile("list.txt", new TextEncoder().encode(lines.join("\n")));

  onProgress({ step: "rendering", percent: 38, message: "Rendering video" });

  const { w, h } = RESOLUTIONS[settings.resolution];
  const vf = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=${settings.fps},format=yuv420p`;

  const codec = settings.codec === "h265" ? "libx265" : "libx264";
  const preset = settings.quality === "fast" ? "ultrafast" : settings.quality === "high" ? "slow" : "medium";
  const crf = settings.quality === "fast" ? "28" : settings.quality === "high" ? "18" : "23";

  const outName = settings.filename.toLowerCase().endsWith(".mp4")
    ? settings.filename
    : `${settings.filename}.mp4`;

  const args = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", "list.txt",
    "-vf", vf,
    "-r", String(settings.fps),
    "-c:v", codec,
    "-preset", preset,
    "-crf", crf,
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    outName,
  ];

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outName);
  const bytes = data as Uint8Array;
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);

  // Cleanup virtual FS to free memory.
  try {
    for (const f of fileNames) await ffmpeg.deleteFile(f);
    await ffmpeg.deleteFile("list.txt");
    await ffmpeg.deleteFile(outName);
  } catch {
    /* ignore */
  }

  onProgress({ step: "finalizing", percent: 100, message: "Done" });
  return { blob, url, size: blob.size };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  return `${m}m ${r}s`;
}
