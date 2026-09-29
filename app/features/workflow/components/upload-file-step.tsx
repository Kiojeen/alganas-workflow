import { useEffect, useRef, useState } from "react";
import {
  AiImageIcon,
  AiMagicIcon,
  Cancel01Icon,
  FileUploadIcon,
  RefreshIcon,
  TextCreationIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { ImageZoom } from "@/components/ui/image-zoom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { setDivision } from "../lib/chapter-division";
import {
  defaultChapterLabel,
  isEnglishChapterLabel,
} from "../lib/chapter-labels";
import type {
  BookConfig,
  BookLanguage,
  CoverKind,
  CoverPageSize,
  Preview,
} from "../types";
import {
  ACTIVE_TOGGLE_CLASS,
  BookPagesFields,
} from "./chapter-division-fields";

export { ACTIVE_TOGGLE_CLASS };

export type FileFieldProps = {
  preview: Preview | null;
  pdfPage: number;
  busy: boolean;
  onFile: (f: File | null) => void;
  onPageChange: (page: number) => void;
  /** AI result shown in place of the upload until removed. */
  outputImage: string | null;
  generating: boolean;
  extracting: boolean;
  canRunAi: boolean;
  onGenerateImage: () => void;
  onGenerateText: () => void;
  onGenerateBoth: () => void;
  onRemoveOutput: () => void;
};

export function UploadFileStep({
  file,
  bookConfig,
  onBookConfigChange,
  disabled,
}: {
  file: FileFieldProps;
  bookConfig: BookConfig;
  onBookConfigChange: (config: BookConfig) => void;
  disabled: boolean;
}) {
  const englishLabel = isEnglishChapterLabel(bookConfig.chapterLabel);
  const language: BookLanguage =
    bookConfig.language ?? (englishLabel ? "en" : "ar");

  const setLanguage = (next: BookLanguage) => {
    const keepLabel = (next === "en") === englishLabel;
    onBookConfigChange({
      ...bookConfig,
      language: next,
      coverSide: next === "en" ? "ltr" : "rtl",
      chapterLabel: keepLabel
        ? bookConfig.chapterLabel
        : defaultChapterLabel(next),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="نوع الغلاف">
          <Select
            value={bookConfig.coverKind ?? "wrap"}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "wrap" && value !== "page") return;
              onBookConfigChange({
                ...bookConfig,
                coverKind: value as CoverKind,
              });
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wrap">غلاف وشريط</SelectItem>
              <SelectItem value="page">غلاف صفحة واحدة</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="حجم الغلاف">
          <Select
            value={bookConfig.pageSize ?? "a4"}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "a4" && value !== "a5") return;
              onBookConfigChange({
                ...bookConfig,
                pageSize: value as CoverPageSize,
              });
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4 — 21×29.7 سم</SelectItem>
              <SelectItem value="a5">A5 — 14.8×21 سم</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="لغة الكتاب">
          <ToggleGroup
            type="single"
            value={language}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "ar" && value !== "en") return;
              setLanguage(value);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem
              value="en"
              className={cn("flex-1 text-xs", ACTIVE_TOGGLE_CLASS)}
            >
              English
            </ToggleGroupItem>
            <ToggleGroupItem
              value="ar"
              className={cn("flex-1 text-xs", ACTIVE_TOGGLE_CLASS)}
            >
              عربي
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field label="تقسيم الفصول">
          <ToggleGroup
            type="single"
            value={bookConfig.division}
            disabled={disabled}
            onValueChange={(value) => {
              if (value !== "pages" && value !== "chapters") return;
              onBookConfigChange(setDivision(bookConfig, value));
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem
              value="pages"
              className={cn(
                "flex-1 text-xs whitespace-normal",
                ACTIVE_TOGGLE_CLASS,
              )}
            >
              حسب الصفحات
            </ToggleGroupItem>
            <ToggleGroupItem
              value="chapters"
              className={cn(
                "flex-1 text-xs whitespace-normal",
                ACTIVE_TOGGLE_CLASS,
              )}
            >
              حسب الفصول
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </div>

      <BookPagesFields
        bookConfig={bookConfig}
        disabled={disabled}
        onBookConfigChange={onBookConfigChange}
      />

      <FileField {...file} disabled={disabled} />
      <Separator />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function IconAction({
  label,
  icon,
  disabled,
  busy,
  tone = "default",
  onClick,
}: {
  label: string;
  icon: typeof AiMagicIcon;
  disabled?: boolean;
  busy?: boolean;
  tone?: "default" | "primary" | "destructive";
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={onClick}
          aria-label={label}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors disabled:opacity-50",
            tone === "default" && "border-input hover:bg-muted text-foreground",
            tone === "primary" &&
              "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
            tone === "destructive" &&
              "border-input text-muted-foreground hover:border-destructive/40 hover:text-destructive hover:bg-destructive/10",
          )}
        >
          {busy ? (
            <Spinner className="size-3" />
          ) : (
            <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={2} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function FileField({
  preview,
  pdfPage,
  busy,
  disabled,
  onFile,
  onPageChange,
  outputImage,
  generating,
  extracting,
  canRunAi,
  onGenerateImage,
  onGenerateText,
  onGenerateBoth,
  onRemoveOutput,
}: FileFieldProps & { disabled: boolean }) {
  const [dragging, setDragging] = useState(false);
  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  useEffect(() => {
    if (disabled) return;
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      const items = Array.from(event.clipboardData?.items ?? []);
      const file =
        items.find((item) => item.kind === "file")?.getAsFile() ??
        event.clipboardData?.files?.[0] ??
        null;
      if (!file) return;
      event.preventDefault();
      onFileRef.current(file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [disabled]);

  const dragProps = {
    onDragOver: (event: React.DragEvent) => {
      if (disabled) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      if (!dragging) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) return;
      onFile(event.dataTransfer.files?.[0] ?? null);
    },
  };

  const input = (
    <Input
      type="file"
      accept="image/*,application/pdf"
      className="hidden"
      disabled={disabled}
      onChange={(e) => {
        onFile(e.target.files?.[0] ?? null);
        e.target.value = "";
      }}
    />
  );

  if (!preview) {
    return (
      <Label
        {...dragProps}
        className={cn(
          "border-input bg-input/10 text-muted-foreground hover:bg-input/20 flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed px-3 py-2.5 text-xs transition-colors",
          dragging && "border-primary bg-primary/10 text-foreground",
          disabled && "cursor-not-allowed",
        )}
      >
        <HugeiconsIcon icon={FileUploadIcon} className="size-4 shrink-0" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-foreground font-medium">
            {dragging ? "أفلت الملف هنا" : "صورة الغلاف أو ملف PDF"}
          </span>
          <span className="text-[11px]">
            اسحب أو اضغط
            <span className="hidden md:inline"> أو الصق بـ Ctrl+V</span>
          </span>
        </span>
        {input}
      </Label>
    );
  }

  const shown = outputImage ?? preview.url;
  const aiBusy = generating || extracting;
  const aiDisabled = disabled || !canRunAi || aiBusy;

  return (
    <div
      {...dragProps}
      className={cn(
        "bg-card flex items-center gap-2 rounded-md border p-1.5 transition-colors",
        dragging && "border-primary bg-primary/10",
      )}
    >
      <div className="bg-muted relative h-12 w-9 shrink-0 overflow-hidden rounded border">
        <ImageZoom>
          <img
            src={shown}
            alt={outputImage ? "الصورة المولّدة" : "صورة الغلاف"}
            className="h-12 w-9 object-cover"
          />
        </ImageZoom>
        {outputImage && !generating && (
          <span className="bg-primary text-primary-foreground pointer-events-none absolute start-0.5 top-0.5 rounded px-0.5 text-[8px] font-semibold">
            AI
          </span>
        )}
        {(busy || generating) && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <Spinner className="size-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <IconAction
          label="توليد الصورة بالذكاء الاصطناعي"
          icon={AiImageIcon}
          tone="primary"
          disabled={aiDisabled}
          busy={generating && !extracting}
          onClick={onGenerateImage}
        />
        <IconAction
          label="استخراج الاسم والوصف"
          icon={TextCreationIcon}
          tone="primary"
          disabled={aiDisabled}
          busy={extracting && !generating}
          onClick={onGenerateText}
        />
        <IconAction
          label="الاسم والوصف ثم الصورة"
          icon={AiMagicIcon}
          tone="primary"
          disabled={aiDisabled}
          busy={generating && extracting}
          onClick={onGenerateBoth}
        />
        {outputImage && (
          <IconAction
            label="إزالة الصورة المولّدة"
            icon={Cancel01Icon}
            tone="destructive"
            disabled={disabled || generating}
            onClick={onRemoveOutput}
          />
        )}
      </div>

      <div className="ms-auto flex items-center gap-1">
        {preview.kind === "pdf" && (
          <Input
            type="number"
            min={1}
            value={pdfPage}
            disabled={disabled || busy}
            onChange={(e) => onPageChange(Number(e.target.value) || 1)}
            aria-label="صفحة PDF"
            title="صفحة PDF"
            className="h-7 w-14 px-2 text-xs"
          />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Label
              aria-label="استبدال الملف"
              className={cn(
                "border-input hover:bg-muted flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                className="size-3.5"
                strokeWidth={2}
              />
              {input}
            </Label>
          </TooltipTrigger>
          <TooltipContent>استبدال الملف</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
