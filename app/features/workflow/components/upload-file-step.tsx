import { FileUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BookConfig, Preview } from "../types";
import { Separator } from "@/components/ui/separator";
import { ImagePreview } from "./image-preview";

export function UploadFileStep({
  preview,
  pdfPage,
  busy,
  onFile,
  onPageChange,
  bookConfig,
  onBookConfigChange,
  disabled,
}: {
  preview: Preview | null;
  pdfPage: number;
  busy: boolean;
  onFile: (f: File | null) => void;
  onPageChange: (page: number) => void;
  bookConfig: BookConfig;
  onBookConfigChange: (config: BookConfig) => void;
  disabled: boolean;
}) {
  const chaptersDisabled = bookConfig.autoChapter;
  const autoChapters =
    bookConfig.numPages > 720 ? Math.ceil(bookConfig.numPages / 720) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            عدد الصفحات
          </Label>
          <Input
            type="number"
            min={1}
            value={bookConfig.numPages}
            disabled={disabled}
            onChange={(e) =>
              onBookConfigChange({
                ...bookConfig,
                numPages: Number(e.target.value) || 0,
              })
            }
            className="h-8"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            عدد الفصول
          </Label>
          <Input
            type="number"
            min={1}
            value={
              bookConfig.autoChapter ? autoChapters : bookConfig.numChapters
            }
            disabled={disabled || chaptersDisabled}
            onChange={(e) =>
              onBookConfigChange({
                ...bookConfig,
                numChapters: Number(e.target.value) || 1,
              })
            }
            className="h-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={bookConfig.autoChapter}
          onCheckedChange={(checked) =>
            onBookConfigChange({
              ...bookConfig,
              autoChapter: Boolean(checked),
            })
          }
          disabled={disabled}
          id="auto-chapter"
        />
        <Label htmlFor="auto-chapter" className="text-xs font-medium">
          تقسيم تلقائي إلى فصول (كل فصل ≤ 720 صفحة). إن لم تُفعّل يبقى الكتاب
          مجلدًا واحدًا بعدد صفحات كبير.
        </Label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          اسم الكتاب
        </Label>
        <Input
          value={bookConfig.bookName ?? ""}
          disabled={disabled}
          onChange={(e) =>
            onBookConfigChange({
              ...bookConfig,
              bookName: e.target.value,
            })
          }
          placeholder="يظهر على كعب الكتاب"
          className="h-8"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          تسمية الفصل
        </Label>
        <Input
          value={bookConfig.chapterLabel}
          disabled={disabled}
          onChange={(e) =>
            onBookConfigChange({
              ...bookConfig,
              chapterLabel: e.target.value,
            })
          }
          placeholder="مثال: chapter, volume, part"
          className="h-8"
        />
      </div>

      <Separator />
      <Label
        className={cn(
          "border-input bg-input/10 text-muted-foreground hover:bg-input/20 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-xs transition-colors",
          disabled && "cursor-not-allowed",
        )}
      >
        <HugeiconsIcon icon={FileUploadIcon} className="size-4" />
        {preview ? "استبدال الملف" : "رفع صورة أو ملف PDF"}
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
          <Label className="text-muted-foreground text-xs font-medium">
            Page
          </Label>
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
        <ImagePreview url={preview.url} name={preview.name} busy={busy} />
      )}
    </div>
  );
}
