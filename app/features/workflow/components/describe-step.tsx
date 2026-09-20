import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { ModelSelect } from "./model-select";

export function DescribeStep({
  ai,
  onAiChange,
  bookName,
  description,
  onBookNameChange,
  onDescriptionChange,
  extractEnabled,
}: {
  ai: string;
  onAiChange: (id: string) => void;
  bookName: string;
  description: string;
  onBookNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  extractEnabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        اسم الكتاب يُحرَّر هنا. عند تفعيل الاستخراج يُرسل الغلاف إلى نموذج
        نص/رؤية لاقتراح الاسم والوصف.
      </p>
      <ModelSelect
        kind="text"
        value={ai}
        onChange={onAiChange}
        disabled={!extractEnabled}
        placeholder="اختر نموذج نص أو رؤية"
      />

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          اسم الكتاب
        </Label>
        <Input
          value={bookName}
          onChange={(e) => onBookNameChange(e.target.value)}
          placeholder="يظهر على كعب الكتاب"
          className="h-8"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground text-xs font-medium">
          وصف الكتاب
        </Label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="وصف يظهر على شريط الوجه الآخر"
          rows={4}
        />
      </div>
    </div>
  );
}
