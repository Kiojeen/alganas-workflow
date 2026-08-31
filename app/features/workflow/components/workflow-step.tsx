import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { Job, StepStatus } from "../types";
import { StepBadge } from "./step-badge";
import { StepNode } from "./step-node";

export function WorkflowStep({
  job,
  index,
  status,
  children,
}: {
  job: Job;
  index: number;
  status: StepStatus;
  children?: React.ReactNode;
}) {
  const muted = status === "muted";

  return (
    <li className="flex gap-3">
      <StepNode status={status} index={index} />

      <Card
        className={cn(
          "mb-3 flex-1 transition-all",
          muted && "pointer-events-none opacity-50 saturate-0",
          status === "start" && "ring-primary ring-2",
          status === "done" && "ring-primary/40 ring-1",
        )}
      >
        <Separator />
        <CardContent className="flex flex-col gap-3 py-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md",
                status === "start" && "bg-primary text-primary-foreground",
                status === "active" && "bg-secondary text-secondary-foreground",
                status === "done" && "bg-primary/10 text-primary",
              )}
            >
              <HugeiconsIcon
                icon={job.icon}
                className="size-4"
                strokeWidth={2}
              />
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
          </div>

          {children}
        </CardContent>
      </Card>
    </li>
  );
}
