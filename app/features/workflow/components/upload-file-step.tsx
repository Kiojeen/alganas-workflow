import { FileUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { BookConfig, Preview } from "../types";
import {
  CHAPTER_LABEL_OPTIONS,
  MAX_PAGES_PER_VOLUME,
  PAGES_PER_SPINE_CM,
  resolveChapters,
  spineWidthCm,
} from "../lib/cover-layout";
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
  const chapters = resolveChapters(bookConfig);
  const cap = bookConfig.maxPagesPerChapter || MAX_PAGES_PER_VOLUME;
  const singleSpine = spineWidthCm(Math.max(1, bookConfig.numPages || 1));
  const chapterLabel =
    CHAPTER_LABEL_OPTIONS.find((option) => option === bookConfig.chapterLabel) ??
    "الفصل";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          عدد صفحات الكتاب
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
        {!bookConfig.multiChapter && (
          <p className="text-muted-foreground text-[11px]">
            كعب الكتاب {singleSpine.toFixed(2)} سم (كل {PAGES_PER_SPINE_CM} صفحة
            = 1 سم).
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          الفصول
        </Label>
        <ToggleGroup
          type="single"
          value={bookConfig.multiChapter ? "multi" : "single"}
          disabled={disabled}
          onValueChange={(value) => {
            if (!value) return;
            onBookConfigChange({
              ...bookConfig,
              multiChapter: value === "multi",
              maxPagesPerChapter:
                bookConfig.maxPagesPerChapter || MAX_PAGES_PER_VOLUME,
            });
          }}
          variant="outline"
          size="sm"
          spacing={0}
          className="w-full"
        >
          <ToggleGroupItem
            value="single"
            className="flex-1 whitespace-normal text-xs"
          >
            فصل واحد
          </ToggleGroupItem>
          <ToggleGroupItem
            value="multi"
            className="flex-1 whitespace-normal text-xs"
          >
            أكثر من فصل
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {bookConfig.multiChapter && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs font-medium">
              الحد الأقصى لصفحات الفصل
            </Label>
            <Input
              type="number"
              min={1}
              value={cap}
              disabled={disabled}
              onChange={(e) =>
                onBookConfigChange({
                  ...bookConfig,
                  maxPagesPerChapter: Math.max(
                    1,
                    Number(e.target.value) || MAX_PAGES_PER_VOLUME,
                  ),
                })
              }
              className="h-8"
            />
            <p className="text-muted-foreground text-[11px]">
              نقسم إجمالي الصفحات على هذا الحد. كل فصل يأخذ حتى {cap} صفحة وكعبًا
              محسوبًا من عدد صفحاته.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs font-medium">
              تسمية الفصل
            </Label>
            <Select
              value={chapterLabel}
              disabled={disabled}
              onValueChange={(value) =>
                onBookConfigChange({
                  ...bookConfig,
                  chapterLabel: value,
                })
              }
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHAPTER_LABEL_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={bookConfig.chapterLabelUppercase === true}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onBookConfigChange({
                    ...bookConfig,
                    chapterLabelUppercase: checked === true,
                  })
                }
              />
              أحرف كبيرة
            </label>
          </div>

          <div className="rounded-md border px-3 py-2">
            <p className="text-muted-foreground mb-1.5 text-[11px]">
              {chapters.length} {chapters.length === 1 ? "فصل" : "فصول"}
            </p>
            <ul className="space-y-1 text-xs">
              {chapters.map((chapter) => (
                <li
                  key={chapter.index}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{chapter.label || `الفصل ${chapter.index}`}</span>
                  <span className="text-muted-foreground font-mono" dir="ltr">
                    {chapter.pages} صفحة · {spineWidthCm(chapter.pages).toFixed(2)}{" "}
                    سم
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

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
