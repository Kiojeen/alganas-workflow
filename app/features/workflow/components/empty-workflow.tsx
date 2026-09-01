import { PlusSignIcon, WorkflowSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyWorkflow({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center p-4">
      <Empty dir="rtl">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={WorkflowSquare01Icon} />
          </EmptyMedia>
          <EmptyTitle>لا توجد مشاريع بعد</EmptyTitle>
          <EmptyDescription>
            أنشئ مشروعًا جديد للبدء.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onCreate} className="gap-1.5">
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            مشروع جديد
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}