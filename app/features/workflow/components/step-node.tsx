import {
  CheckmarkCircle01Icon,
  CircleLock01Icon,
  Clock01Icon,
  PlayCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Spinner } from "@/components/ui/spinner";

import type { StepStatus } from "../types";

export function StepNode({
  status,
  index,
}: {
  status: StepStatus;
  index: number;
}) {
  if (status === "muted") {
    return (
      <div className="bg-muted ring-border flex size-8 items-center justify-center rounded-full ring-1">
        <HugeiconsIcon
          icon={CircleLock01Icon}
          className="text-muted-foreground size-3.5"
          strokeWidth={2}
        />
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="bg-primary text-primary-foreground ring-primary flex size-8 items-center justify-center rounded-full ring-2">
        <HugeiconsIcon
          icon={PlayCircleIcon}
          className="size-4"
          strokeWidth={2}
        />
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="bg-primary text-primary-foreground ring-primary/30 flex size-8 items-center justify-center rounded-full ring-2">
        <Spinner />
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="bg-primary/10 text-primary ring-primary/40 flex size-8 items-center justify-center rounded-full ring-1">
        <HugeiconsIcon
          icon={CheckmarkCircle01Icon}
          className="size-4"
          strokeWidth={2}
        />
      </div>
    );
  }

  return (
    <div
      className="text-muted-foreground flex size-8 flex-col items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 bg-background"
      title={`الخطوة ${index + 1} لم تُنفَّذ بعد`}
      aria-label={`الخطوة ${index + 1} لم تُنفَّذ بعد`}
    >
      <HugeiconsIcon icon={Clock01Icon} className="size-3.5" strokeWidth={2} />
    </div>
  );
}
