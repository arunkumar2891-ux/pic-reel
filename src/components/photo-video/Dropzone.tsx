import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { ACCEPTED_TYPES, MAX_IMAGES, type UploadedImage } from "@/lib/video-types";

interface Props {
  current: number;
  onAdd: (images: UploadedImage[]) => void;
}

function readImageMeta(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        url,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
      });
    };
    img.onerror = () => reject(new Error(`Could not read ${file.name}`));
    img.src = url;
  });
}

export function Dropzone({ current, onAdd }: Props) {
  const onDrop = useCallback(
    async (accepted: File[], rejected: { file: File; errors: { code: string }[] }[]) => {
      if (rejected.length > 0) {
        toast.error(`${rejected.length} file(s) rejected. Only JPG, PNG, WEBP are allowed.`);
      }
      const remaining = MAX_IMAGES - current;
      if (remaining <= 0) {
        toast.error(`You've reached the ${MAX_IMAGES}-image limit.`);
        return;
      }
      const toProcess = accepted.slice(0, remaining);
      if (accepted.length > remaining) {
        toast.warning(`Only added the first ${remaining} images (max ${MAX_IMAGES}).`);
      }
      try {
        const imgs = await Promise.all(toProcess.map(readImageMeta));
        onAdd(imgs);
        if (imgs.length > 0) toast.success(`Added ${imgs.length} image${imgs.length === 1 ? "" : "s"}.`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to read images.");
      }
    },
    [current, onAdd],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
      }`}
      style={{ boxShadow: isDragActive ? "var(--shadow-glow)" : undefined }}
    >
      <input {...getInputProps()} />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
        {isDragActive ? <ImagePlus className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {isDragActive ? "Drop them here" : "Drag & drop your photos"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        or click to browse · JPG, PNG, WEBP · up to {MAX_IMAGES} images
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        {current} / {MAX_IMAGES} added
      </p>
    </div>
  );
}
