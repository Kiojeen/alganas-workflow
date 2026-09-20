import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { useModels } from "../context";

export function DescribeStep({
  ai,
  onAiChange,
  bookName,
  description,
  onBookNameChange,
  onDescriptionChange,
  disabled,
}: {
  ai: string;
  onAiChange: (id: string) => void;
  bookName: string;
  description: string;
  onBookNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  disabled: boolean;
}) {
  const { models } = useModels();
  const named = models.filter((m) => m.name.trim());
  const selectedAi = named.some((m) => m.id === ai) ? ai : (named[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        عند التشغيل يُرسل الغلاف إلى Gemini لاستخراج اسم الكتاب ووصف قصير. عطّل
        الخطوة لكتابة الاسم يدويًا في الخطوة الأولى.
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
            <SelectValue placeholder="اختر نموذج Gemini" />
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
          اسم الكتاب المستخرج
        </Label>
        <Input
          value={bookName}
          disabled={disabled}
          onChange={(e) => onBookNameChange(e.target.value)}
          placeholder="يظهر بعد التشغيل"
          className="h-8"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          وصف الكتاب
        </Label>
        <Textarea
          value={description}
          disabled={disabled}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="وصف يظهر على شريط الوجه الآخر"
          rows={4}
        />
      </div>
    </div>
  );
}
