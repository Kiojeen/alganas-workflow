import { Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ARABIC_CHAPTER_LABELS,
  ENGLISH_CHAPTER_LABELS,
  formatChapterLabel,
  isEnglishChapterLabel,
  normalizeChapterLabelId,
} from "../lib/chapter-labels";
import type { BookConfig } from "../types";

/** Chapter word (Volume, الجزء, …) with a live example and the English caps toggle. */
export function ChapterLabelField({
  bookConfig,
  disabled,
  onBookConfigChange,
}: {
  bookConfig: BookConfig;
  disabled: boolean;
  onBookConfigChange: (config: BookConfig) => void;
}) {
  const labelId = normalizeChapterLabelId(bookConfig.chapterLabel);
  const englishLabel = isEnglishChapterLabel(labelId);
  const options =
    bookConfig.language === "en"
      ? ENGLISH_CHAPTER_LABELS
      : ARABIC_CHAPTER_LABELS;
  const uppercase = bookConfig.chapterLabelUppercase === true;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={labelId}
        disabled={disabled}
        onValueChange={(chapterLabel) =>
          onBookConfigChange({ ...bookConfig, chapterLabel })
        }
      >
        <SelectTrigger
          className="min-w-0 flex-1"
          size="sm"
          aria-label="تسمية الفصل"
        >
          <HugeiconsIcon
            icon={Tag01Icon}
            className="text-muted-foreground size-3.5 shrink-0"
            strokeWidth={2}
          />
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
      <span
        className="text-muted-foreground shrink-0 text-[11px] tabular-nums"
        dir="auto"
      >
        {formatChapterLabel(labelId, 1, uppercase)}
      </span>
      {englishLabel && (
        <label
          className="flex shrink-0 items-center gap-1.5 text-[11px]"
          title="أحرف كبيرة"
        >
          <Checkbox
            checked={uppercase}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onBookConfigChange({
                ...bookConfig,
                chapterLabelUppercase: checked === true,
              })
            }
            aria-label="أحرف كبيرة"
          />
          Aa
        </label>
      )}
    </div>
  );
}
