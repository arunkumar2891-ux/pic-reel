import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Codec,
  FPS,
  PhotoDuration,
  QualityPreset,
  ResolutionKey,
  VideoSettings,
} from "@/lib/video-types";
import { RESOLUTIONS } from "@/lib/video-types";

interface Props {
  settings: VideoSettings;
  onChange: (next: VideoSettings) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  const set = <K extends keyof VideoSettings>(k: K, v: VideoSettings[K]) =>
    onChange({ ...settings, [k]: v });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="FPS">
        <Select value={String(settings.fps)} onValueChange={(v) => set("fps", Number(v) as FPS)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[24, 30, 48, 60, 120].map((f) => (
              <SelectItem key={f} value={String(f)}>{f} fps</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Resolution">
        <Select value={settings.resolution} onValueChange={(v) => set("resolution", v as ResolutionKey)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(RESOLUTIONS) as ResolutionKey[]).map((k) => (
              <SelectItem key={k} value={k}>{RESOLUTIONS[k].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Codec">
        <Select value={settings.codec} onValueChange={(v) => set("codec", v as Codec)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="h264">H.264</SelectItem>
            <SelectItem value="h265">H.265 (HEVC)</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Quality preset">
        <Select value={settings.quality} onValueChange={(v) => set("quality", v as QualityPreset)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fast">Fast</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="high">High quality</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Photo duration">
        <Select
          value={String(settings.photoDuration)}
          onValueChange={(v) => set("photoDuration", Number(v) as PhotoDuration)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[0.1, 0.25, 0.5, 1, 2, 3, 5].map((d) => (
              <SelectItem key={d} value={String(d)}>{d}s per photo</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Output filename">
        <Input
          value={settings.filename}
          onChange={(e) => set("filename", e.target.value)}
          placeholder="output.mp4"
          maxLength={120}
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
