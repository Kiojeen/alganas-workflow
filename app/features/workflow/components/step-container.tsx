import { CheckmarkCircle01Icon, PlayIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

import type { Job, StepStatus } from "../types";
import { StepBadge } from "./step-badge";
import { StepNode } from "./step-node";

export function StepContainer({
  job,
  index,
  status,
  involved,
  mandatory,
  hideRun,
  allowRerun,
  lockContent,
  autoRun,
  showAutoRun,
  onToggleAutoRun,
  onToggleInvolved,
  onRun,
  onRerun,
  children,
}: {
  job: Job;
  index: number;
  status: StepStatus;
  involved: boolean;
  mandatory: boolean;
  hideRun?: boolean;
  allowRerun?: boolean;
  lockContent?: boolean;
  autoRun?: boolean;
  showAutoRun?: boolean;
  onToggleAutoRun?: (value: boolean) => void;
  onToggleInvolved: (id: string, value: boolean) => void;
  onRun: () => void;
  onRerun?: () => void;
  children?: React.ReactNode;
}) {
  const contentLocked = lockContent ?? !involved;

  return (
    <div className="flex gap-3">
      <div className="hidden flex-col items-center pt-2.5 md:flex">
        <StepNode status={status} index={index} />
      </div>

      <Card
        className={cn(
          "min-w-0 flex-1 border transition-all max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:py-0 max-md:ring-0",
          status === "muted" && "opacity-60 saturate-0",
          status === "pending" &&
            "md:border-dashed md:border-muted-foreground/40 md:bg-muted/15",
        )}
      >
        <CardHeader className="hidden flex-row items-center gap-3 space-y-0 md:flex">
          <div
            className={cn(
              "bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md",
              status === "ready" && "bg-primary text-primary-foreground",
              status === "pending" &&
                "border-muted-foreground/40 text-muted-foreground border border-dashed bg-transparent",
              status === "running" && "bg-primary text-primary-foreground",
              status === "done" && "bg-primary/10 text-primary",
            )}
          >
            <HugeiconsIcon icon={job.icon} className="size-4" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{job.title}</p>
              <StepBadge status={status} />
            </div>
            <p className="text-muted-foreground truncate text-xs">
              {job.description}
            </p>
          </div>

          {showAutoRun && (
            <label className="flex items-center gap-2 text-xs">
              تشغيل تلقائي
              <Switch
                checked={autoRun === true}
                onCheckedChange={(value) => onToggleAutoRun?.(value)}
                aria-label={`تشغيل تلقائي لـ ${job.title}`}
              />
            </label>
          )}

          <RunSlot
            status={status}
            onRun={onRun}
            onRerun={onRerun}
            hideRun={hideRun}
            allowRerun={allowRerun}
          />

          {!mandatory && (
            <Switch
              checked={involved}
              onCheckedChange={(value) => onToggleInvolved(job.id, value)}
              aria-label={`تبديل مشاركة ${job.title}`}
              title={`تبديل مشاركة ${job.title}`}
            />
          )}
        </CardHeader>

        <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
          <StepBadge status={status} />
          <div className="flex items-center gap-3">
            {showAutoRun && (
              <label className="flex items-center gap-2 text-xs">
                تشغيل تلقائي
                <Switch
                  checked={autoRun === true}
                  onCheckedChange={(value) => onToggleAutoRun?.(value)}
                  aria-label={`تشغيل تلقائي لـ ${job.title}`}
                />
              </label>
            )}
            <RunSlot
              status={status}
              onRun={onRun}
              onRerun={onRerun}
              hideRun={hideRun}
              allowRerun={allowRerun}
            />
            {!mandatory && (
              <label className="flex items-center gap-2 text-xs">
                تفعيل
                <Switch
                  checked={involved}
                  onCheckedChange={(value) => onToggleInvolved(job.id, value)}
                  aria-label={`تبديل مشاركة ${job.title}`}
                />
              </label>
            )}
          </div>
        </div>

        <CardContent className="max-md:px-0">
          <div
            className={cn(
              contentLocked && "pointer-events-none opacity-60 saturate-0",
            )}
          >
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RunSlot({
  status,
  onRun,
  onRerun,
  hideRun,
  allowRerun,
}: {
  status: StepStatus;
  onRun: () => void;
  onRerun?: () => void;
  hideRun?: boolean;
  allowRerun?: boolean;
}) {
  if (hideRun) {
    if (status === "running") return <Spinner />;
    return null;
  }
  if (status === "ready") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onRun}
        className="gap-1"
        aria-label="تشغيل"
      >
        <HugeiconsIcon icon={PlayIcon} className="size-3.5" />
        تشغيل
      </Button>
    );
  }
  if (status === "running") {
    return <Spinner />;
  }
  if (status === "done" && allowRerun) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onRerun ?? onRun}
        className="gap-1"
        aria-label="إعادة التشغيل"
      >
        <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
        إعادة التشغيل
      </Button>
    );
  }
  if (status === "done") {
    return (
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        className="text-primary size-4"
        strokeWidth={2}
      />
    );
  }
  return null;
}
