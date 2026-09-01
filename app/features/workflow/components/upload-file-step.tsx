import { FileUploadIcon, Maximize04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ImageZoom } from "@/components/ui/image-zoom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

import type { Preview } from "../types";

export function UploadFileStep({
  preview,
  pdfPage,
  busy,
  onFile,
  onPageChange,
  disabled,
}: {
  preview: Preview | null;
  pdfPage: number;
  busy: boolean;
  onFile: (f: File | null) => void;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label
        className={cn(
          "border-input bg-input/10 text-muted-foreground hover:bg-input/20 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-xs transition-colors",
          disabled && "cursor-not-allowed",
        )}
      >
        <HugeiconsIcon icon={FileUploadIcon} className="size-4" />
        {preview ? "Replace file" : "Upload an image or PDF"}
        <Input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          disabled={disabled}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </Label>

      {preview?.kind === "pdf" && (
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground text-xs font-medium">
            Page
          </label>
          <Input
            type="number"
            min={1}
            value={pdfPage}
            disabled={disabled || busy}
            onChange={(e) => onPageChange(Number(e.target.value) || 1)}
            className="h-6 w-20"
          />
        </div>
      )}

      {preview && (
        <div className="bg-muted relative overflow-hidden rounded-md border">
          {!busy && (
            <Badge
              variant="outline"
              className="absolute inset-s-2 top-2 z-50 [&>svg]:size-3!"
            >
              <HugeiconsIcon icon={Maximize04Icon} />
            </Badge>
          )}

          <ImageZoom>
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-64 w-full object-contain"
            />
          </ImageZoom>
          {busy && (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
