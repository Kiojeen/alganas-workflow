import {
  CheckmarkCircle01Icon,
  CircleLock01Icon,
  Clock01Icon,
  FileUploadIcon,
  PlayIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

import type { Job, StepStatus } from "../types";
import { StepBadge } from "./step-badge";

export function RunAllBar({
  enabledSteps,
  hasFile,
  running,
  allDone,
  onRun,
}: {
  enabledSteps: Job[];
  hasFile: boolean;
  running: boolean;
  allDone: boolean;
  onRun: () => void;
}) {
  const summary = !hasFile
    ? "ارفع ملف الغلاف ثم شغّل الخطوات المفعّلة."
    : enabledSteps.length === 0
      ? "لا خطوات ذكاء اصطناعي مفعّلة؛ الصورة تمر مباشرة إلى التصميم."
      : `سيُشغَّل بالتوازي: ${enabledSteps.map((job) => job.shortTitle).join(" و")}.`;

  return (
    <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">الخطوات</p>
        <p className="text-muted-foreground truncate text-[11px]">{summary}</p>
      </div>
      <Button
        size="sm"
        onClick={onRun}
        disabled={!hasFile || running || enabledSteps.length === 0}
        className="shrink-0 gap-1.5"
      >
        {running ? (
          <Spinner />
        ) : (
          <HugeiconsIcon
            icon={allDone ? RefreshIcon : PlayIcon}
            className="size-3.5"
          />
        )}
        {running ? "قيد التشغيل" : allDone ? "إعادة تشغيل الكل" : "تشغيل"}
      </Button>
    </div>
  );
}

export function StepRail({
  jobs,
  statuses,
  active,
  onSelect,
}: {
  jobs: Job[];
  statuses: StepStatus[];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav
      className="bg-muted/40 flex shrink-0 gap-1 border-b p-1.5"
      aria-label="خطوات سير العمل"
    >
      {jobs.map((job, index) => {
        const status = statuses[index];
        const isActive = index === active;
        return (
          <button
            key={job.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={isActive ? "step" : undefined}
            title={job.title}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md border border-transparent px-1 py-1.5 text-center transition-colors",
              "hover:bg-background/70 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
              isActive && "bg-background border-border shadow-xs",
              status === "muted" && !isActive && "opacity-60",
            )}
          >
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  "text-muted-foreground ring-border flex size-5 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ring-1",
                  (status === "ready" || status === "running") &&
                    "bg-primary text-primary-foreground ring-primary",
                  status === "done" &&
                    "bg-primary/10 text-primary ring-primary/40",
                )}
              >
                {index + 1}
              </span>
              <StepStatusIcon status={status} />
            </span>
            <span
              className={cn(
                "w-full truncate text-[11px] leading-tight",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {job.shortTitle}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === "running") return <Spinner className="size-3" />;
  if (status === "done") {
    return (
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        className="text-primary size-3.5"
        strokeWidth={2}
      />
    );
  }
  if (status === "ready") {
    return (
      <HugeiconsIcon
        icon={PlayIcon}
        className="text-primary size-3"
        strokeWidth={2}
      />
    );
  }
  if (status === "waiting") {
    return (
      <HugeiconsIcon
        icon={FileUploadIcon}
        className="text-muted-foreground size-3.5"
        strokeWidth={2}
      />
    );
  }
  if (status === "muted") {
    return (
      <HugeiconsIcon
        icon={CircleLock01Icon}
        className="text-muted-foreground size-3.5"
        strokeWidth={2}
      />
    );
  }
  return (
    <HugeiconsIcon
      icon={Clock01Icon}
      className="text-muted-foreground size-3.5"
      strokeWidth={2}
    />
  );
}

export function StepSection({
  job,
  status,
  involved,
  mandatory,
  showRun,
  lockContent,
  onToggleInvolved,
  onRun,
  onRerun,
  children,
}: {
  job: Job;
  status: StepStatus;
  involved: boolean;
  mandatory: boolean;
  showRun?: boolean;
  lockContent?: boolean;
  onToggleInvolved: (id: string, value: boolean) => void;
  onRun: () => void;
  onRerun?: () => void;
  children?: React.ReactNode;
}) {
  const contentLocked = lockContent ?? !involved;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {!mandatory && (
          <label className="bg-background flex items-center justify-between gap-2.5 rounded-md border px-2.5 py-1.5">
            <span className="flex flex-col leading-none">
              <span className="text-xs font-medium">تفعيل الخطوة</span>
              <span className="text-muted-foreground mt-1 text-[10px]">
                تُشغَّل مع زر «تشغيل» وتُدرَج في النتيجة
              </span>
            </span>
            <Switch
              checked={involved}
              onCheckedChange={(value) => onToggleInvolved(job.id, value)}
              aria-label={`تفعيل ${job.title}`}
            />
          </label>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  "bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md",
                  (status === "ready" || status === "running") &&
                    "bg-primary text-primary-foreground",
                  status === "done" && "bg-primary/10 text-primary",
                )}
              >
                <HugeiconsIcon
                  icon={job.icon}
                  className="size-3.5"
                  strokeWidth={2}
                />
              </div>
              <h2 className="text-sm font-semibold">{job.title}</h2>
              <StepBadge status={status} />
            </div>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {job.description}
            </p>
          </div>
          {showRun && (
            <RunSlot status={status} onRun={onRun} onRerun={onRerun} />
          )}
        </div>
      </div>

      <div
        className={cn(
          contentLocked && "pointer-events-none opacity-60 saturate-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function RunSlot({
  status,
  onRun,
  onRerun,
}: {
  status: StepStatus;
  onRun: () => void;
  onRerun?: () => void;
}) {
  if (status === "ready") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onRun}
        className="shrink-0 gap-1"
        aria-label="تشغيل هذه الخطوة"
      >
        <HugeiconsIcon icon={PlayIcon} className="size-3.5" />
        تشغيل
      </Button>
    );
  }
  if (status === "running") {
    return <Spinner className="mt-1 shrink-0" />;
  }
  if (status === "done") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={onRerun ?? onRun}
        className="shrink-0 gap-1"
        aria-label="إعادة تشغيل هذه الخطوة"
      >
        <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
        إعادة
      </Button>
    );
  }
  return null;
}
