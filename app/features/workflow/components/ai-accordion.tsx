import { useState } from "react";
import {
  AiBrain01Icon,
  AiImageIcon,
  AiMagicIcon,
  BookOpen01Icon,
  Note01Icon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useModels } from "../context";
import { ModelSelect } from "./model-select";

/**
 * Two collapsed sections under the file: the book's title/description (with a
 * one-click extraction) and the image model/prompt used by the AI button on
 * the file field.
 */
export function AiAccordion({
  describeAi,
  onDescribeAiChange,
  bookName,
  description,
  onBookNameChange,
  onDescriptionChange,
  singlePage,
  canExtract,
  extracting,
  onExtract,
  imageAi,
  onImageAiChange,
  prompt,
  onPromptChange,
}: {
  describeAi: string;
  onDescribeAiChange: (id: string) => void;
  bookName: string;
  description: string;
  onBookNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  singlePage: boolean;
  canExtract: boolean;
  extracting: boolean;
  onExtract: () => void;
  imageAi: string;
  onImageAiChange: (id: string) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
}) {
  const { prompts } = useModels();
  const [selectedPromptId, setSelectedPromptId] = useState("");

  return (
    <Accordion type="single" className="bg-card">
      <AccordionItem value="text">
        <AccordionTrigger className="items-center px-3 hover:no-underline">
          <span className="flex items-center gap-2">
            <HugeiconsIcon
              icon={TextFontIcon}
              className="text-muted-foreground size-4"
              strokeWidth={2}
            />
            اسم الكتاب ووصفه
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 px-1 pb-3">
          <div className="flex items-center gap-2">
            <ModelSelect
              kind="text"
              value={describeAi}
              onChange={onDescribeAiChange}
              placeholder="نموذج الرؤية"
              label={null}
              icon={AiBrain01Icon}
              className="min-w-0 flex-1"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={!canExtract || extracting}
                  onClick={onExtract}
                  aria-label="استخراج الاسم والوصف من الغلاف"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-8 shrink-0 items-center justify-center rounded-md disabled:opacity-50"
                >
                  {extracting ? (
                    <Spinner className="size-3.5" />
                  ) : (
                    <HugeiconsIcon icon={AiMagicIcon} className="size-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>استخراج الاسم والوصف من الغلاف</TooltipContent>
            </Tooltip>
          </div>

          <InputGroup className="h-8">
            <InputGroupAddon>
              <HugeiconsIcon icon={BookOpen01Icon} className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              value={bookName}
              onChange={(e) => onBookNameChange(e.target.value)}
              placeholder="اسم الكتاب"
              aria-label="اسم الكتاب"
              className="h-8"
            />
            {bookName && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="مسح الاسم"
                  onClick={() => onBookNameChange("")}
                >
                  ×
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          {!singlePage && (
            <div className="relative">
              <HugeiconsIcon
                icon={Note01Icon}
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-2.5 size-3.5"
              />
              <Textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="وصف الكتاب على الوجه الآخر"
                aria-label="وصف الكتاب"
                rows={4}
                className="ps-8 text-xs"
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="image">
        <AccordionTrigger className="items-center px-3 hover:no-underline">
          <span className="flex items-center gap-2">
            <HugeiconsIcon
              icon={AiImageIcon}
              className="text-muted-foreground size-4"
              strokeWidth={2}
            />
            توليد الصورة
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2 px-1 pb-3">
          <ModelSelect
            kind="image"
            value={imageAi}
            onChange={onImageAiChange}
            placeholder="نموذج الصور"
            label={null}
            icon={AiImageIcon}
          />

          {prompts.length > 0 && (
            <Select
              value={selectedPromptId || undefined}
              onValueChange={(id) => {
                const saved = prompts.find((item) => item.id === id);
                setSelectedPromptId(id);
                if (saved) onPromptChange(saved.text);
              }}
            >
              <SelectTrigger
                className="w-full"
                size="sm"
                aria-label="تعليمات محفوظة"
              >
                <HugeiconsIcon
                  icon={Note01Icon}
                  className="text-muted-foreground size-3.5 shrink-0"
                  strokeWidth={2}
                />
                <SelectValue placeholder="تعليمات محفوظة" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name || "بدون اسم"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Textarea
            dir="ltr"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Describe how the AI should generate the image…"
            aria-label="تعليمات التوليد"
            rows={4}
            className="max-h-48 overflow-y-auto text-xs"
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
