import { Download, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESOLUTIONS, type VideoSettings } from "@/lib/video-types";
import { formatBytes, formatDuration } from "@/lib/ffmpeg-runner";

interface Props {
  url: string;
  size: number;
  photoCount: number;
  settings: VideoSettings;
  onReset: () => void;
}

export function ResultView({ url, size, photoCount, settings, onReset }: Props) {
  const res = RESOLUTIONS[settings.resolution];
  const filename = settings.filename.toLowerCase().endsWith(".mp4")
    ? settings.filename
    : `${settings.filename || "output"}.mp4`;
  const duration = photoCount * settings.photoDuration;

  const info = [
    ["Filename", filename],
    ["Resolution", `${res.w}×${res.h}`],
    ["FPS", `${settings.fps}`],
    ["Duration", formatDuration(duration)],
    ["File size", formatBytes(size)],
  ];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="aspect-video w-full bg-black">
        <video src={url} controls className="h-full w-full" />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <h3 className="text-base font-semibold">Your video is ready</h3>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {info.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted/50 p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-foreground" title={v}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="lg">
            <a href={url} download={filename}>
              <Download className="h-4 w-4" /> Download video
            </a>
          </Button>
          <Button variant="outline" size="lg" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Create another video
          </Button>
        </div>
      </div>
    </div>
  );
}
