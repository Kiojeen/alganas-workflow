import { useEffect, useRef, useState } from "react";
import {
  AiImageIcon,
  AiMagicIcon,
  Cancel01Icon,
  ClipboardPasteIcon,
  FileUploadIcon,
  RefreshIcon,
  TextCreationIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import {
  comboText,
  isEditableTarget,
  matchesCombo,
  shortcutFor,
  type ShortcutId,
} from "@/lib/shortcuts";
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
  CoverBinding,
  CoverKind,
  CoverPageSize,
  Preview,
} from "../types";
import {
  ACTIVE_TOGGLE_CLASS,
  BookPagesFields,
} from "./chapter-division-fields";
import { PremadeCoverField } from "./premade-cover-field";

/** Shared with the `U` shortcut in the workflow. */
export const COVER_FILE_INPUT_ID = "cover-file-input";

const COVER_FILE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  pdf: "application/pdf",
};

function isCoverType(type: string) {
  return type.startsWith("image/") || type === "application/pdf";
}

/** Copied files often arrive without a MIME type; the name still has one. */
function withCoverType(file: File) {
  if (isCoverType(file.type)) return file;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = COVER_FILE_TYPES[ext];
  if (!type) return file;
  return new File([file], file.name, {
    type,
    lastModified: file.lastModified,
  });
}

function sniffCoverType(bytes: Uint8Array) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  return "";
}

async function asCoverFile(file: File) {
  const named = withCoverType(file);
  if (isCoverType(named.type)) return named;
  const sniffed = sniffCoverType(
    new Uint8Array(await file.slice(0, 16).arrayBuffer()),
  );
  if (!sniffed) return null;
  const ext = sniffed === "application/pdf" ? "pdf" : sniffed.slice(6);
  return new File([file], file.name || `paste.${ext}`, { type: sniffed });
}

function fileFromTransfer(data: DataTransfer | null) {
  if (!data) return null;
  const files: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  if (files.length === 0) files.push(...Array.from(data.files ?? []));
  return files[0] ?? null;
}

async function fileFromClipboardRead() {
  if (!navigator.clipboard?.read) return null;
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((entry) => isCoverType(entry));
      if (!type) continue;
      const blob = await item.getType(type);
      const ext = type === "application/pdf" ? "pdf" : type.slice(6);
      return new File([blob], `paste.${ext}`, { type });
    }
  } catch {
    return null;
  }
  return null;
}

const NO_CLIPBOARD_IMAGE =
  "لا توجد صورة في الحافظة. الملفات المنسوخة تُلصق بـ Ctrl+V أو بالسحب.";

/** Reads a screenshot or copied image from the clipboard into a field. */
async function pasteFromClipboard(onFile: (file: File) => void) {
  const file = await fileFromClipboardRead();
  if (file) onFile(file);
  else toast.error(NO_CLIPBOARD_IMAGE);
}

export const COVER_BACK_FILE_INPUT_ID = "cover-back-file-input";

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
  /** Shortcut shown on the image-generation button. Defaults to the front cover. */
  imageShortcut?: ShortcutId;
  onGenerateText: () => void;
  onGenerateBoth: () => void;
  onRemoveOutput: () => void;
};

export function UploadFileStep({
  file,
  back,
  bookConfig,
  onBookConfigChange,
  disabled,
}: {
  file: FileFieldProps;
  /** Back cover, shown only for the double-cover layout. */
  back?: FileFieldProps;
  bookConfig: BookConfig;
  onBookConfigChange: (config: BookConfig) => void;
  disabled: boolean;
}) {
  const englishLabel = isEnglishChapterLabel(bookConfig.chapterLabel);
  const language: BookLanguage =
    bookConfig.language ?? (englishLabel ? "en" : "ar");

  const backTarget = bookConfig.coverKind === "double" ? back : undefined;
  const premade = bookConfig.coverKind === "premade";
  const targets = useRef({ file, back: backTarget, premade });
  targets.current = { file, back: backTarget, premade };

  // Ctrl+V pastes the front cover from the paste event, which is the only
  // place a file copied from the OS shows up. Ctrl+Shift+V never carries
  // files, so it is caught on keydown and reads the clipboard for the back.
  useEffect(() => {
    if (disabled) return;

    const onPaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      if (targets.current.premade) return;
      const { file } = targets.current;
      if (file.busy) return;
      const raw = fileFromTransfer(event.clipboardData);
      if (!raw) return;
      event.preventDefault();
      void asCoverFile(raw).then((cover) => {
        if (cover) file.onFile(cover);
        else toast.error("الملف يجب أن يكون صورة أو PDF.");
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (!matchesCombo(event, shortcutFor("paste-back").combo)) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      const { back } = targets.current;
      if (!back) {
        toast.error("لصق الظهر متاح في الغلاف المزدوج فقط.");
        return;
      }
      if (back.busy) return;
      void pasteFromClipboard(back.onFile);
    };

    document.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [disabled]);

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
              if (
                value !== "wrap" &&
                value !== "double" &&
                value !== "premade"
              ) {
                return;
              }
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
              <SelectItem value="double">غلاف مزدوج</SelectItem>
              <SelectItem value="premade">غلاف جاهز</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="نوع التجليد">
          <Select
            value={bookConfig.binding ?? "standard"}
            disabled={disabled}
            onValueChange={(value) => {
              if (
                value !== "standard" &&
                value !== "spiral" &&
                value !== "hardcover"
              )
                return;
              const binding = value as CoverBinding;
              const leavingPremadeBoard =
                bookConfig.coverKind === "premade" &&
                (bookConfig.binding === "hardcover") !==
                  (binding === "hardcover");
              const pageSize =
                binding === "hardcover"
                  ? bookConfig.pageSize === "b5"
                    ? "b5"
                    : "a4"
                  : bookConfig.pageSize === "a5"
                    ? "a5"
                    : "a4";
              onBookConfigChange({
                ...bookConfig,
                binding,
                pageSize,
                premadeCoverId: leavingPremadeBoard
                  ? ""
                  : bookConfig.premadeCoverId,
              });
              if (leavingPremadeBoard) file.onFile(null);
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">عادي</SelectItem>
              <SelectItem value="spiral">حلزوني</SelectItem>
              <SelectItem value="hardcover">غلاف مقوى</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="حجم الغلاف">
          <Select
            value={bookConfig.pageSize ?? "a4"}
            disabled={disabled}
            onValueChange={(value) => {
              const hardcover = bookConfig.binding === "hardcover";
              if (hardcover) {
                if (value !== "a4" && value !== "b5") return;
              } else if (value !== "a4" && value !== "a5") return;
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
              {bookConfig.binding === "hardcover" ? (
                <SelectItem value="b5">B5 — 17×25 سم</SelectItem>
              ) : (
                <SelectItem value="a5">A5 — 14.8×21 سم</SelectItem>
              )}
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

      {bookConfig.coverKind === "premade" ? (
        <>
          <PremadeCoverField
            selectedId={bookConfig.premadeCoverId}
            board={
              bookConfig.binding === "hardcover" ? "hardcover" : "standard"
            }
            disabled={disabled}
            onSelect={(cover, nextFile) => {
              onBookConfigChange({
                ...bookConfig,
                premadeCoverId: cover.id,
              });
              file.onFile(nextFile);
            }}
            onRemoveSelected={() => {
              onBookConfigChange({ ...bookConfig, premadeCoverId: "" });
              file.onFile(null);
            }}
          />
          <Field label="اسم الكتاب">
            <Input
              value={bookConfig.bookName}
              disabled={disabled}
              onChange={(e) =>
                onBookConfigChange({ ...bookConfig, bookName: e.target.value })
              }
              placeholder="يظهر على الواجهة والكعب"
              aria-label="اسم الكتاب"
            />
          </Field>
        </>
      ) : (
        <FileField
          {...file}
          disabled={disabled}
          heading={bookConfig.coverKind === "double" ? "الغلاف" : undefined}
        />
      )}
      {bookConfig.coverKind === "double" && back && (
        <FileField
          {...back}
          disabled={disabled}
          heading="الظهر"
          imageOnly
          inputId={COVER_BACK_FILE_INPUT_ID}
          pasteShortcut="paste-back"
        />
      )}
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

function PasteButton({
  shortcut,
  disabled,
  onFile,
}: {
  shortcut: ShortcutId;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <IconAction
      label={`لصق من الحافظة · ${comboText(shortcut)}`}
      icon={ClipboardPasteIcon}
      disabled={disabled}
      onClick={() => void pasteFromClipboard(onFile)}
    />
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
  heading,
  imageOnly = false,
  imageShortcut = "ai-image",
  inputId = COVER_FILE_INPUT_ID,
  pasteShortcut = "paste",
}: FileFieldProps & {
  disabled: boolean;
  heading?: string;
  /** Hide title extraction; the back cover is only redrawn. */
  imageOnly?: boolean;
  inputId?: string;
  /** Shown on the clipboard button and the empty-state hint. */
  pasteShortcut?: ShortcutId;
}) {
  const [dragging, setDragging] = useState(false);

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
      id={inputId}
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

  const frame = (node: React.ReactNode) =>
    heading ? (
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          {heading}
        </Label>
        {node}
      </div>
    ) : (
      node
    );

  if (!preview) {
    return frame(
      <div className="flex items-center gap-1.5">
        <Label
          {...dragProps}
          className={cn(
            "border-input bg-input/10 text-muted-foreground hover:bg-input/20 flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md border border-dashed px-3 py-2.5 text-xs transition-colors",
            dragging && "border-primary bg-primary/10 text-foreground",
            disabled && "cursor-not-allowed",
          )}
        >
          <HugeiconsIcon icon={FileUploadIcon} className="size-4 shrink-0" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-foreground font-medium">
              {dragging
                ? "أفلت الملف هنا"
                : heading === "الظهر"
                  ? "صورة الظهر أو ملف PDF"
                  : "صورة الغلاف أو ملف PDF"}
            </span>
            <span className="text-[11px]">
              اسحب أو اضغط
              <span className="hidden md:inline">
                {" "}
                أو الصق بـ {comboText(pasteShortcut)}
              </span>
            </span>
          </span>
          {input}
        </Label>
        <PasteButton
          shortcut={pasteShortcut}
          disabled={disabled}
          onFile={onFile}
        />
      </div>,
    );
  }

  const shown = outputImage ?? preview.url;
  const aiBusy = generating || extracting;
  const aiDisabled = disabled || !canRunAi || aiBusy;

  return frame(
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
          label={`توليد الصورة بالذكاء الاصطناعي · ${comboText(imageShortcut)}`}
          icon={AiImageIcon}
          tone="primary"
          disabled={aiDisabled}
          busy={generating && !extracting}
          onClick={onGenerateImage}
        />
        {!imageOnly && (
          <>
            <IconAction
              label={`${heading === "الغلاف" ? "استخراج الاسم" : "استخراج الاسم والوصف"} · ${comboText("ai-text")}`}
              icon={TextCreationIcon}
              tone="primary"
              disabled={aiDisabled}
              busy={extracting && !generating}
              onClick={onGenerateText}
            />
            <IconAction
              label={`${heading === "الغلاف" ? "الاسم ثم الصورة" : "الاسم والوصف ثم الصورة"} · ${comboText("ai-both")}`}
              icon={AiMagicIcon}
              tone="primary"
              disabled={aiDisabled}
              busy={generating && extracting}
              onClick={onGenerateBoth}
            />
          </>
        )}
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
        <PasteButton
          shortcut={pasteShortcut}
          disabled={disabled || busy}
          onFile={onFile}
        />
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
    </div>,
  );
}
