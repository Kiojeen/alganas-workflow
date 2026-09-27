import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FileUploadIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { BookConfig, BookLanguage, CoverKind, Preview } from "../types";
import { useModels } from "../context";
import {
  chapterNameInput,
  isCustomChapterName,
  pageCap,
  remainingPages,
  resetChapterName,
  setChapterCount,
  setChapterName,
  setChapterPageAt,
  setDivision,
  setMaxPagesPerChapter,
  setTotalPages,
  unassignedPagesError,
} from "../lib/chapter-division";
import {
  ARABIC_CHAPTER_LABELS,
  ENGLISH_CHAPTER_LABELS,
  formatChapterLabel,
  isEnglishChapterLabel,
  normalizeChapterLabelId,
} from "../lib/chapter-labels";
import { isSinglePageCover, resolveChapters, spineWidthCm } from "../lib/cover-layout";
import { ImageZoom } from "@/components/ui/image-zoom";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

const SEGMENT_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

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
  const { pagesPerSpineCm } = useModels();
  const chapters = resolveChapters(bookConfig);
  const cap = pageCap(bookConfig);
  const singlePage = isSinglePageCover(bookConfig);
  const labelId = normalizeChapterLabelId(bookConfig.chapterLabel);
  const englishLabel = isEnglishChapterLabel(labelId);
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
        : next === "en"
          ? "en:Chapter"
          : "ar:فصل",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <FileField
        preview={preview}
        pdfPage={pdfPage}
        busy={busy}
        disabled={disabled}
        onFile={onFile}
        onPageChange={onPageChange}
      />

      <Separator />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            لغة الكتاب
          </Label>
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
            <ToggleGroupItem value="ar" className="flex-1 text-xs">
              عربي
            </ToggleGroupItem>
            <ToggleGroupItem value="en" className="flex-1 text-xs">
              English
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-muted-foreground text-[11px]">
            {language === "en"
              ? "الغلاف الأمامي يمين الكعب، والتسميات بالإنجليزية."
              : "الغلاف الأمامي يسار الكعب، والتسميات بالعربية."}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            نوع الغلاف
          </Label>
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
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            تقسيم الفصول
          </Label>
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
              className="flex-1 whitespace-normal text-xs"
            >
              حسب الصفحات
            </ToggleGroupItem>
            <ToggleGroupItem
              value="chapters"
              className="flex-1 whitespace-normal text-xs"
            >
              حسب الفصول
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <ChapterLabelField
          labelId={labelId}
          language={language}
          englishLabel={englishLabel}
          uppercase={bookConfig.chapterLabelUppercase === true}
          disabled={disabled}
          onLabelChange={(chapterLabel) =>
            onBookConfigChange({ ...bookConfig, chapterLabel })
          }
          onUppercaseChange={(chapterLabelUppercase) =>
            onBookConfigChange({ ...bookConfig, chapterLabelUppercase })
          }
        />
      </div>

      {bookConfig.division === "pages" ? (
        <PagesDivision
          bookConfig={bookConfig}
          cap={cap}
          disabled={disabled}
          pagesPerSpineCm={pagesPerSpineCm}
          showSpine={!singlePage}
          chapters={chapters}
          onBookConfigChange={onBookConfigChange}
        />
      ) : (
        <ChaptersDivision
          bookConfig={bookConfig}
          disabled={disabled}
          pagesPerSpineCm={pagesPerSpineCm}
          showSpine={!singlePage}
          chapters={chapters}
          onBookConfigChange={onBookConfigChange}
        />
      )}
    </div>
  );
}

function FileField({
  preview,
  pdfPage,
  busy,
  disabled,
  onFile,
  onPageChange,
}: {
  preview: Preview | null;
  pdfPage: number;
  busy: boolean;
  disabled: boolean;
  onFile: (f: File | null) => void;
  onPageChange: (page: number) => void;
}) {
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
          "border-input bg-input/10 text-muted-foreground hover:bg-input/20 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-6 text-center text-xs transition-colors",
          dragging && "border-primary bg-primary/10 text-foreground",
          disabled && "cursor-not-allowed",
        )}
      >
        <HugeiconsIcon icon={FileUploadIcon} className="size-5" />
        <span className="text-foreground font-medium">
          {dragging ? "أفلت الملف هنا" : "رفع صورة الغلاف أو ملف PDF"}
        </span>
        <span className="text-[11px]">
          اسحب الملف هنا أو اضغط للاختيار
          <span className="hidden md:inline"> أو الصقه بـ Ctrl+V</span>
        </span>
        {input}
      </Label>
    );
  }

  return (
    <div
      {...dragProps}
      className={cn(
        "flex items-center gap-3 rounded-md border p-2 transition-colors",
        dragging && "border-primary bg-primary/10",
      )}
    >
      <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-md border">
        <ImageZoom>
          <img
            src={preview.url}
            alt={preview.name}
            className="size-16 object-cover"
          />
        </ImageZoom>
        {busy && (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-xs font-medium" title={preview.name}>
          {preview.name}
        </p>
        <p className="text-muted-foreground text-[11px]">
          {preview.kind === "pdf" ? "ملف PDF" : "صورة"} · اضغط الصورة للتكبير
          <span className="hidden md:inline"> · اسحب أو الصق ملفًا لاستبداله</span>
        </p>
        {preview.kind === "pdf" && (
          <div className="flex items-center gap-1.5">
            <Label className="text-muted-foreground text-[11px] font-medium">
              الصفحة
            </Label>
            <Input
              type="number"
              min={1}
              value={pdfPage}
              disabled={disabled || busy}
              onChange={(e) => onPageChange(Number(e.target.value) || 1)}
              className="h-6 w-16 text-xs"
            />
          </div>
        )}
      </div>

      <Label
        className={cn(
          "border-input hover:bg-muted flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
        استبدال
        {input}
      </Label>
    </div>
  );
}

function PagesDivision({
  bookConfig,
  cap,
  disabled,
  pagesPerSpineCm,
  showSpine,
  chapters,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  cap: number;
  disabled: boolean;
  pagesPerSpineCm: number;
  showSpine: boolean;
  chapters: ReturnType<typeof resolveChapters>;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="عدد صفحات الكتاب"
          value={bookConfig.numPages}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setTotalPages(bookConfig, value))
          }
        />
        <NumberField
          label="الحد الأقصى لصفحات الفصل"
          value={cap}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setMaxPagesPerChapter(bookConfig, value))
          }
        />
      </div>
      <ChapterNameList
        bookConfig={bookConfig}
        chapters={chapters}
        pagesPerSpineCm={pagesPerSpineCm}
        showSpine={showSpine}
        disabled={disabled}
        onBookConfigChange={onBookConfigChange}
      />
    </>
  );
}

function ChaptersDivision({
  bookConfig,
  disabled,
  pagesPerSpineCm,
  showSpine,
  chapters,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  disabled: boolean;
  pagesPerSpineCm: number;
  showSpine: boolean;
  chapters: ReturnType<typeof resolveChapters>;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  const total = Math.max(1, bookConfig.numPages || 1);
  const used = chapters.reduce((sum, chapter) => sum + chapter.pages, 0);
  const remaining = remainingPages(bookConfig);
  const allocationError = unassignedPagesError(bookConfig);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="عدد صفحات الكتاب"
          value={bookConfig.numPages}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setTotalPages(bookConfig, value))
          }
        />
        <NumberField
          label="عدد الفصول"
          min={1}
          max={total}
          value={bookConfig.chapterCount}
          disabled={disabled}
          onChange={(value) =>
            onBookConfigChange(setChapterCount(bookConfig, value))
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <DivisionBar
          chapters={chapters}
          total={total}
          remaining={remaining}
          invalid={allocationError !== null}
        />
        {allocationError ? (
          <p className="text-destructive text-[11px] font-medium" role="alert">
            {allocationError}
          </p>
        ) : (
          <p className="text-muted-foreground text-[11px]">
            موزّع {used} من {total}. لا توجد صفحات متبقية.
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {chapters.map((chapter, index) => (
          <li key={chapter.index} className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-sm",
                  SEGMENT_COLORS[index % SEGMENT_COLORS.length],
                )}
              />
              <ChapterNameField
                bookConfig={bookConfig}
                index={index}
                disabled={disabled}
                onBookConfigChange={onBookConfigChange}
              />
              <DraftNumberInput
                value={chapter.pages}
                disabled={disabled}
                invalid={allocationError !== null}
                onCommit={(value) =>
                  onBookConfigChange(setChapterPageAt(bookConfig, index, value))
                }
                className="h-8 w-16 md:w-24"
              />
              <span className="text-muted-foreground shrink-0 text-[11px]">
                صفحة
                {showSpine && (
                  <span className="hidden font-mono md:inline" dir="ltr">
                    {" · "}
                    {spineWidthCm(chapter.pages, pagesPerSpineCm).toFixed(2)} سم
                  </span>
                )}
              </span>
            </li>
        ))}
      </ul>
    </>
  );
}

function ChapterLabelField({
  labelId,
  language,
  englishLabel,
  uppercase,
  disabled,
  onLabelChange,
  onUppercaseChange,
}: {
  labelId: string;
  language: BookLanguage;
  englishLabel: boolean;
  uppercase: boolean;
  disabled: boolean;
  onLabelChange: (id: string) => void;
  onUppercaseChange: (uppercase: boolean) => void;
}) {
  const options =
    language === "en" ? ENGLISH_CHAPTER_LABELS : ARABIC_CHAPTER_LABELS;
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        تسمية الفصل
      </Label>
      <Select
        value={labelId}
        disabled={disabled}
        onValueChange={onLabelChange}
      >
        <SelectTrigger className="w-full" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-[11px]">
        مثال: {formatChapterLabel(labelId, 1, uppercase)}
      </p>
      {englishLabel && (
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={uppercase}
            disabled={disabled}
            onCheckedChange={(checked) => onUppercaseChange(checked === true)}
          />
          أحرف كبيرة
        </label>
      )}
    </div>
  );
}

function ChapterNameList({
  bookConfig,
  chapters,
  pagesPerSpineCm,
  showSpine,
  disabled,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  chapters: ReturnType<typeof resolveChapters>;
  pagesPerSpineCm: number;
  showSpine: boolean;
  disabled: boolean;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  const total = Math.max(1, bookConfig.numPages || 1);
  return (
    <div className="flex flex-col gap-2">
      <DivisionBar chapters={chapters} total={total} remaining={0} invalid={false} />
      <p className="text-muted-foreground text-[11px]">
        {chapters.length} {chapters.length === 1 ? "فصل" : "فصول"}
      </p>
      <ul className="space-y-2">
        {chapters.map((chapter, index) => (
          <li key={chapter.index} className="flex items-center gap-2">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-sm",
                SEGMENT_COLORS[index % SEGMENT_COLORS.length],
              )}
            />
            <ChapterNameField
              bookConfig={bookConfig}
              index={index}
              disabled={disabled}
              onBookConfigChange={onBookConfigChange}
            />
            <span className="text-muted-foreground shrink-0 text-[11px]">
              {chapter.pages} صفحة
              {showSpine && (
                <span className="hidden font-mono md:inline" dir="ltr">
                  {" · "}
                  {spineWidthCm(chapter.pages, pagesPerSpineCm).toFixed(2)} سم
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChapterNameField({
  bookConfig,
  index,
  disabled,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  index: number;
  disabled: boolean;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  const custom = isCustomChapterName(bookConfig, index);
  return (
    <InputGroup className="h-8 min-w-0 flex-1">
      <InputGroupInput
        value={chapterNameInput(bookConfig, index)}
        disabled={disabled}
        onChange={(e) =>
          onBookConfigChange(setChapterName(bookConfig, index, e.target.value))
        }
        className="h-8"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label="تلقائي"
          title="تلقائي"
          disabled={disabled || !custom}
          onClick={() => onBookConfigChange(resetChapterName(bookConfig, index))}
        >
          <HugeiconsIcon icon={RefreshIcon} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function DivisionBar({
  chapters,
  total,
  remaining,
  invalid,
}: {
  chapters: ReturnType<typeof resolveChapters>;
  total: number;
  remaining: number;
  invalid: boolean;
}) {
  const scale = Math.max(total, 1);
  return (
    <div
      className={cn(
        "bg-muted flex h-8 w-full overflow-hidden rounded-md",
        invalid && "ring-1 ring-destructive",
      )}
      dir="ltr"
      role="img"
      aria-label="توزيع الصفحات على الفصول"
    >
      {chapters.map((chapter, index) => (
        <ContrastSegment
          key={chapter.index}
          className={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
          width={(chapter.pages / scale) * 100}
          label={String(chapter.pages)}
          title={`${chapter.label} · ${chapter.pages}`}
        />
      ))}
      {remaining > 0 && (
        <div
          className="flex h-full min-w-7 items-center justify-center overflow-hidden bg-destructive px-0.5 text-[11px] font-semibold text-white tabular-nums"
          style={{ width: `${(remaining / scale) * 100}%` }}
          title={`متبقي ${remaining}`}
        >
          {remaining}
        </div>
      )}
    </div>
  );
}

function ContrastSegment({
  className,
  width,
  label,
  title,
}: {
  className: string;
  width: number;
  label: string;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState("#f7f3ea");

  useLayoutEffect(() => {
    const read = () => {
      const node = ref.current;
      if (!node) return;
      setInk(inkForBackground(getComputedStyle(node).backgroundColor));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [className]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full min-w-7 items-center justify-center overflow-hidden px-0.5 text-[11px] font-semibold tabular-nums",
        className,
      )}
      style={{ width: `${width}%`, color: ink }}
      title={title}
    >
      {label}
    </div>
  );
}

function inkForBackground(color: string): string {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length < 3 || channels.some((channel) => !Number.isFinite(channel))) {
    return "#f7f3ea";
  }
  const [r, g, b] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#1c1814" : "#f7f3ea";
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <DraftNumberInput
        value={value}
        disabled={disabled}
        onCommit={onChange}
        className="h-8"
      />
    </div>
  );
}

function DraftNumberInput({
  value,
  disabled,
  invalid,
  onCommit,
  className,
}: {
  value: number;
  disabled: boolean;
  invalid?: boolean;
  onCommit: (value: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      type="number"
      inputMode="numeric"
      step={1}
      value={draft ?? String(value)}
      disabled={disabled}
      aria-invalid={invalid}
      className={className}
      onChange={(e) => {
        const next = e.target.value;
        const fromSpinner = !(e.nativeEvent as InputEvent).inputType;
        if (fromSpinner && next !== "") {
          const parsed = Number(next);
          if (Number.isFinite(parsed)) {
            onCommit(parsed);
            setDraft(null);
            return;
          }
        }
        setDraft(next);
      }}
      onBlur={() => {
        const text = draft;
        setDraft(null);
        if (text === null || text === "") return;
        const parsed = Number(text);
        if (Number.isFinite(parsed)) onCommit(parsed);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
