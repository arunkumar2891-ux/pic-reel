import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadedImage } from "@/lib/video-types";

interface Props {
  images: UploadedImage[];
  onReorder: (next: UploadedImage[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function SortableThumb({ image, index, onRemove }: { image: UploadedImage; index: number; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
    >
      <img src={image.url} alt={image.name} className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-1.5">
        <span className="rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-background/90 text-destructive opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
          aria-label={`Remove ${image.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute inset-x-0 bottom-0 flex cursor-grab items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] text-white active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 shrink-0" />
        <span className="truncate">{image.name}</span>
        <span className="ml-auto shrink-0 opacity-70">{image.width}×{image.height}</span>
      </button>
    </div>
  );
}

export function SortableGallery({ images, onReorder, onRemove, onClear }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = images.findIndex((i) => i.id === active.id);
    const newIdx = images.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(images, oldIdx, newIdx));
  };

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {images.length} photo{images.length === 1 ? "" : "s"}
          </h3>
          <p className="text-xs text-muted-foreground">Drag the bottom bar to reorder.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>Clear all</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {images.map((img, idx) => (
              <SortableThumb key={img.id} image={img} index={idx} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
