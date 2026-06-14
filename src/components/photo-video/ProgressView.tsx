import { Progress } from "@/components/ui/progress";
import { Check, Loader2 } from "lucide-react";
import type { RenderProgress } from "@/lib/ffmpeg-runner";

const STEPS: { key: RenderProgress["step"] | "uploading"; label: string }[] = [
  { key: "uploading", label: "Uploading files" },
  { key: "preparing", label: "Preparing images" },
  { key: "rendering", label: "Rendering video" },
  { key: "encoding", label: "Encoding video" },
  { key: "finalizing", label: "Finalizing output" },
];

interface Props {
  progress: RenderProgress;
}

export function ProgressView({ progress }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.key === progress.step);
  const fileCounter = progress.total ? `${progress.current ?? 0}/${progress.total}` : null;
  return (
    <div
      className="rounded-2xl border border-border bg-card p-6"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">Generating your video</h3>
          <p className="text-sm text-muted-foreground">{progress.message}</p>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {Math.round(progress.percent)}%
        </span>
      </div>
      <Progress value={progress.percent} className="mt-4" />
      <ul className="mt-5 space-y-2">
        {STEPS.map((s, i) => {
          const done = i < currentIdx || progress.percent >= 100;
          const active = i === currentIdx && progress.percent < 100;
          return (
            <li key={s.key} className="flex items-center gap-2.5 text-sm">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  done ? "bg-success text-success-foreground" : active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="text-[10px]">{i + 1}</span>}
              </span>
              <span className={done || active ? "text-foreground" : "text-muted-foreground"}>
                {s.label}
                {s.key === "preparing" && fileCounter ? (
                  <span className="ml-2 font-semibold tabular-nums text-primary">{fileCounter}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
