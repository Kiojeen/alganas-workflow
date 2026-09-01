import { PlayIcon, WorkflowSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import type { RunState } from "../types";

export function WorkflowControls({
  involvedCount,
  total,
  progress,
  runState,
  onRun,
  onReset,
  canRun,
}: {
  involvedCount: number;
  total: number;
  progress: number;
  runState: RunState;
  onRun: () => void;
  onReset: () => void;
  canRun: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={WorkflowSquare01Icon}
              className="text-muted-foreground size-4"
            />
            <CardTitle>معالجة الطلبات</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {runState === "running" ? (
              <Button variant="outline" size="sm" disabled>
                <Spinner /> قيد التشغيل
              </Button>
            ) : runState === "done" ? (
              <Button variant="outline" size="sm" onClick={onReset}>
                إعادة تعيين
              </Button>
            ) : (
              <Button size="sm" onClick={onRun} disabled={!canRun}>
                <HugeiconsIcon icon={PlayIcon} className="size-3.5" />
                تشغيل
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          بدّل الخطوات المشاركة (الأولى إلزامية). اضغط تشغيل لتنفيذ الخطوات النشطة.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Separator />

        <div className="flex flex-col gap-1.5">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>
              {involvedCount} من أصل {total} خطوة متضمنة
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="rtl:rotate-180"/>
        </div>
      </CardContent>
    </Card>
  );
}
