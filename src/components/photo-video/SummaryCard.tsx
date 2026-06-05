import { Film, Clock, Image as ImageIcon, Gauge, Monitor, FileVideo } from "lucide-react";
import { RESOLUTIONS, type VideoSettings } from "@/lib/video-types";
import { formatDuration } from "@/lib/ffmpeg-runner";

interface Props {
  count: number;
  settings: VideoSettings;
}

export function SummaryCard({ count, settings }: Props) {
  const totalSeconds = count * settings.photoDuration;
  const res = RESOLUTIONS[settings.resolution];
  const filename = settings.filename.toLowerCase().endsWith(".mp4")
    ? settings.filename
    : `${settings.filename || "output"}.mp4`;

  const items = [
    { icon: ImageIcon, label: "Photos", value: count > 0 ? String(count) : "—" },
    { icon: Clock, label: "Est. duration", value: count > 0 ? formatDuration(totalSeconds) : "—" },
    { icon: Gauge, label: "FPS", value: `${settings.fps}` },
    { icon: Monitor, label: "Resolution", value: `${res.w}×${res.h}` },
    { icon: Film, label: "Codec", value: settings.codec === "h265" ? "H.265" : "H.264" },
    { icon: FileVideo, label: "Output", value: filename },
  ];

  return (
    <div
      className="rounded-2xl border border-border bg-card p-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h3 className="text-sm font-semibold text-foreground">Render summary</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {count > 0 ? `${count} photos × ${settings.photoDuration}s = ${formatDuration(totalSeconds)}` : "Add photos to see your estimate."}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg bg-muted/50 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <it.icon className="h-3 w-3" /> {it.label}
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-foreground" title={it.value}>
              {it.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
