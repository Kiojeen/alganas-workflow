import { Delete02Icon, FileUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import {
  addPremadeCover,
  loadPremadeCoverFile,
  removePremadeCover,
  usePremadeCovers,
  type PremadeBoard,
  type PremadeCover,
} from "../lib/premade-covers";

const LIBRARY_INPUT_ID = "premade-library-input";

export function PremadeCoverField({
  selectedId,
  board,
  disabled,
  onSelect,
  onRemoveSelected,
}: {
  selectedId: string;
  board: PremadeBoard;
  disabled: boolean;
  onSelect: (cover: PremadeCover, file: File) => void;
  onRemoveSelected: () => void;
}) {
  const covers = usePremadeCovers().filter((cover) => cover.board === board);
  const sizeLabel = board === "hardcover" ? "48.7×30" : "47×29.7";

  const upload = async (file: File | null) => {
    if (!file) return;
    try {
      const cover = await addPremadeCover(file, board);
      onSelect(cover, file);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تعذّر حفظ الغلاف الجاهز.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium">
          الأغلفة الجاهزة
        </span>
        <Label
          htmlFor={LIBRARY_INPUT_ID}
          className={cn(
            "border-input hover:bg-muted flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-[11px]",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <HugeiconsIcon icon={FileUploadIcon} className="size-3.5" />
          إضافة للمكتبة
          <input
            id={LIBRARY_INPUT_ID}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              void upload(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </Label>
      </div>
      {covers.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-xs">
          ارفع صورة بنسبة اللوحة {sizeLabel} سم. تُحفظ على هذا الجهاز.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {covers.map((cover) => (
            <PremadeThumb
              key={cover.id}
              cover={cover}
              selected={cover.id === selectedId}
              disabled={disabled}
              onSelect={onSelect}
              onRemove={() => {
                void removePremadeCover(cover.id).then(() => {
                  if (cover.id === selectedId) onRemoveSelected();
                });
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PremadeThumb({
  cover,
  selected,
  disabled,
  onSelect,
  onRemove,
}: {
  cover: PremadeCover;
  selected: boolean;
  disabled: boolean;
  onSelect: (cover: PremadeCover, file: File) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-col gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          void loadPremadeCoverFile(cover.id).then((file) => {
            if (file) onSelect(cover, file);
          });
        }}
        className={cn(
          "bg-muted overflow-hidden rounded-md border",
          selected && "border-primary ring-primary/40 ring-2",
        )}
        title={cover.name}
      >
        {cover.thumbUrl ? (
          <img
            src={cover.thumbUrl}
            alt={cover.name}
            className="aspect-[47/30] w-full object-cover"
          />
        ) : (
          <div className="aspect-[47/30] w-full" />
        )}
      </button>
      <div className="flex items-center gap-1">
        <span className="min-w-0 flex-1 truncate text-[10px]">
          {cover.name}
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`حذف ${cover.name}`}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3" />
        </button>
      </div>
    </li>
  );
}
