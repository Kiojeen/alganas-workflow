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
import { ImagePreview } from "./image-preview";

export function GenerateStep({
  ai,
  onAiChange,
  prompt,
  onPromptChange,
  outputImage,
  disabled,
}: {
  ai: string;
  onAiChange: (id: string) => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  outputImage: string | null;
  disabled: boolean;
}) {
  const { models } = useModels();
  const named = models.filter((m) => m.name.trim());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          نموذج الذكاء الاصطناعي
        </Label>
        <Select value={ai} onValueChange={onAiChange} disabled={disabled}>
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
          التعليمات
        </Label>
        <Textarea
          value={prompt}
          disabled={disabled}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe how the AI should process the input…"
          rows={4}
        />
      </div>

      {outputImage && (
        <div className="flex flex-col gap-1.5">
          <span className="text-primary text-xs font-medium">مخرجات الذكاء الاصطناعي</span>
          <div className="bg-muted overflow-hidden rounded-md border">
            <ImagePreview url={outputImage} name={"مخرجات الذكاء الاصطناعي"} busy={false} />
          </div>
        </div>
      )}
    </div>
  );
}
