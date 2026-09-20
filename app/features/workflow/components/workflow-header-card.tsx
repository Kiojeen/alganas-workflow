import { WorkflowSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function WorkflowHeaderCard({
  involvedCount,
  total,
}: {
  involvedCount: number;
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={WorkflowSquare01Icon}
            className="text-muted-foreground size-4"
          />
          <CardTitle>سير عمل أغلفة الكتب</CardTitle>
        </div>
        <CardDescription>
          ثلاث خطوات أساسية مع استخراج اختياري للاسم والوصف من الغلاف، ثم توليد
          الصورة وترتيب اللوحة وتصدير PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <span className="text-muted-foreground text-xs">
          {involvedCount} من {total} خطوات مشاركة
        </span>
      </CardContent>
    </Card>
  );
}
