import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  FileUploadIcon,
  PaintBrush01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

import type { Job, StepStatus } from "../types";

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
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-transparent px-2 py-2 transition-colors",
              "hover:bg-background/70 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
              isActive && "bg-background border-border shadow-xs",
            )}
          >
            <span
              className={cn(
                "text-muted-foreground ring-border flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums ring-1",
                status === "ready" &&
                  "bg-primary text-primary-foreground ring-primary",
                status === "done" &&
                  "bg-primary/10 text-primary ring-primary/40",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "truncate text-xs leading-tight",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {job.title}
            </span>
            <StepStatusIcon status={status} />
          </button>
        );
      })}
    </nav>
  );
}

function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <HugeiconsIcon
        icon={CheckmarkCircle01Icon}
        className="text-primary size-3.5 shrink-0"
        strokeWidth={2}
      />
    );
  }
  if (status === "ready") {
    return (
      <HugeiconsIcon
        icon={PaintBrush01Icon}
        className="text-primary size-3.5 shrink-0"
        strokeWidth={2}
      />
    );
  }
  if (status === "waiting") {
    return (
      <HugeiconsIcon
        icon={FileUploadIcon}
        className="text-muted-foreground size-3.5 shrink-0"
        strokeWidth={2}
      />
    );
  }
  return (
    <HugeiconsIcon
      icon={Clock01Icon}
      className="text-muted-foreground size-3.5 shrink-0"
      strokeWidth={2}
    />
  );
}
