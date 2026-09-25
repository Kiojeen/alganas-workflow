import { useState } from "react";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useModels } from "../context";
import { downloadDataUrl, fileSafeName } from "../lib/cover-layout";
import { ImagePreview } from "./image-preview";
import { ModelSelect } from "./model-select";

export function GenerateStep({
  ai,
  onAiChange,
  prompt,
  onPromptChange,
  outputImage,
  bookName,
  disabled,
}: {
  ai: string;
  onAiChange: (id: string) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  outputImage: string | null;
  bookName?: string;
  disabled: boolean;
}) {
  const { prompts } = useModels();
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");

  return (
    <div className="flex flex-col gap-3">
      <ModelSelect
        kind="image"
        value={ai}
        onChange={onAiChange}
        disabled={disabled}
        placeholder="اختر نموذج توليد صور"
      />

      {prompts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs font-medium">
            تعليمات محفوظة
          </Label>
          <Select
            value={selectedPromptId || undefined}
            disabled={disabled}
            onValueChange={(id) => {
              const saved = prompts.find((item) => item.id === id);
              setSelectedPromptId(id);
              if (saved) onPromptChange(saved.text);
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder="اختر تعليمات لإدراجها" />
            </SelectTrigger>
            <SelectContent>
              {prompts.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name || "بدون اسم"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          التعليمات (باللغة الإنجليزية)
        </Label>
        <Textarea
          dir="ltr"
          value={prompt}
          disabled={disabled}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe how the AI should generate the image…"
          rows={4}
          className="max-h-48 overflow-y-auto"
        />
      </div>

      {outputImage && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-primary text-xs font-medium">
              مخرجات الذكاء الاصطناعي
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={disabled}
              onClick={() => {
                const name = fileSafeName(bookName ?? "", "cover");
                const ext = outputImage.includes("image/jpeg") ? "jpg" : "png";
                downloadDataUrl(outputImage, `${name}.${ext}`);
              }}
            >
              <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
              تنزيل الصورة
            </Button>
          </div>
          <div className="bg-muted overflow-hidden rounded-md border">
            <ImagePreview url={outputImage} name={"مخرجات الذكاء الاصطناعي"} busy={false} />
          </div>
        </div>
      )}
    </div>
  );
}
