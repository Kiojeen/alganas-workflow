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
          ثلاث خطوات: إعداد الغلاف، توليد اختياري بالذكاء الاصطناعي، ثم ترتيب
          اللوحة وتصدير PDF. الخطوة الأولى إلزامية، ويمكن تعطيل التوليد.
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
