import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Dropzone } from "@/components/photo-video/Dropzone";
import { SortableGallery } from "@/components/photo-video/SortableGallery";
import { SettingsPanel } from "@/components/photo-video/SettingsPanel";
import { SummaryCard } from "@/components/photo-video/SummaryCard";
import { ProgressView } from "@/components/photo-video/ProgressView";
import { ResultView } from "@/components/photo-video/ResultView";
import { DEFAULT_SETTINGS, type UploadedImage, type VideoSettings } from "@/lib/video-types";
import { renderVideo, type RenderProgress } from "@/lib/ffmpeg-runner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Photo to Video Creator — Turn photos into MP4 videos" },
      {
        name: "description",
        content: "Upload, reorder, and render photo sequences into MP4 videos. Choose FPS, resolution, codec, and per-photo duration. Runs entirely in your browser.",
      },
      { property: "og:title", content: "Photo to Video Creator" },
      { property: "og:description", content: "Turn photo sequences into MP4 videos — fully in-browser." },
    ],
  }),
  component: HomePage,
});

type Phase =
  | { kind: "idle" }
  | { kind: "rendering"; progress: RenderProgress }
  | { kind: "done"; url: string; size: number; settings: VideoSettings; count: number };

function HomePage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  useEffect(() => () => images.forEach((i) => URL.revokeObjectURL(i.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const addImages = (next: UploadedImage[]) => setImages((prev) => [...prev, ...next]);
  const removeImage = (id: string) =>
    setImages((prev) => {
      const tgt = prev.find((p) => p.id === id);
      if (tgt) URL.revokeObjectURL(tgt.url);
      return prev.filter((p) => p.id !== id);
    });
  const clearAll = () => {
    images.forEach((i) => URL.revokeObjectURL(i.url));
    setImages([]);
  };

  const canRender = useMemo(
    () => images.length > 0 && settings.filename.trim().length > 0 && phase.kind !== "rendering",
    [images, settings, phase],
  );

  async function handleGenerate() {
    if (images.length === 0) {
      toast.error("Add at least one photo first.");
      return;
    }
    if (!settings.filename.trim()) {
      toast.error("Please provide an output filename.");
      return;
    }
    setPhase({ kind: "rendering", progress: { step: "preparing", percent: 1, message: "Loading encoder…" } });
    try {
      const result = await renderVideo(images, settings, (progress) =>
        setPhase({ kind: "rendering", progress }),
      );
      setPhase({ kind: "done", url: result.url, size: result.size, settings, count: images.length });
      toast.success("Video ready to download.");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? `Render failed: ${e.message}` : "Video generation failed.");
      setPhase({ kind: "idle" });
    }
  }

  function resetAll() {
    if (phase.kind === "done") URL.revokeObjectURL(phase.url);
    clearAll();
    setSettings(DEFAULT_SETTINGS);
    setPhase({ kind: "idle" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />

      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight text-foreground">Photo to Video Creator</h1>
              <p className="text-xs text-muted-foreground">Render MP4s from photo sequences — 100% in your browser.</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
            <Sparkles className="h-3 w-3 text-primary" /> Powered by FFmpeg.wasm
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {phase.kind === "done" ? (
          <ResultView
            url={phase.url}
            size={phase.size}
            photoCount={phase.count}
            settings={phase.settings}
            onReset={resetAll}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <Dropzone current={images.length} onAdd={addImages} />
              <SortableGallery
                images={images}
                onReorder={setImages}
                onRemove={removeImage}
                onClear={clearAll}
              />
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <div
                className="rounded-2xl border border-border bg-card p-5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="text-sm font-semibold text-foreground">Video settings</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Tune output before you render.</p>
                <div className="mt-4">
                  <SettingsPanel settings={settings} onChange={setSettings} />
                </div>
              </div>

              <SummaryCard count={images.length} settings={settings} />

              {phase.kind === "rendering" ? (
                <ProgressView progress={phase.progress} />
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!canRender}
                  onClick={handleGenerate}
                  style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}
                >
                  <Film className="h-4 w-4" /> Generate video
                </Button>
              )}
            </aside>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Your photos never leave your device — rendering happens locally in your browser.
      </footer>
    </div>
  );
}
