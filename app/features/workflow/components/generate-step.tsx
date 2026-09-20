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
import { fileSafeName } from "../lib/cover-layout";
import { ImagePreview } from "./image-preview";

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
  const { models } = useModels();
  const named = models.filter((m) => m.name.trim());

  const selectedAi = named.some((m) => m.id === ai) ? ai : (named[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        هذه الخطوة مفعّلة تلقائيًا. عطّل المفتاح أعلاه لتمرير الصورة مباشرة إلى
        ترتيب الغلاف.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          نموذج الذكاء الاصطناعي
        </Label>
        <Select
          value={selectedAi || undefined}
          onValueChange={onAiChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر نموذجًا (يمكنك إضافة المزيد من الإعدادات)" />
          </SelectTrigger>
          <SelectContent>
            {named.length === 0 ? (
              <div className="text-muted-foreground px-2 py-1.5 text-xs">
                لاتتوفر نماذج حتى الآن
              </div>
            ) : (
              named.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

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
