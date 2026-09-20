import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { fileSafeName } from "../lib/cover-layout";
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
  return (
    <div className="flex flex-col gap-3">
      <ModelSelect
        kind="image"
        value={ai}
        onChange={onAiChange}
        disabled={disabled}
        placeholder="اختر نموذج توليد صور"
      />

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
                const anchor = document.createElement("a");
                anchor.href = outputImage;
                anchor.download = `${name}.${ext}`;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
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
