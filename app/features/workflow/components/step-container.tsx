import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

import type { Job, StepStatus } from "../types";
import { StepNode } from "./step-node";

export function StepContainer({
  job,
  index,
  status,
  involved,
  mandatory,
  onToggleInvolved,
  children,
}: {
  job: Job;
  index: number;
  status: StepStatus;
  involved: boolean;
  mandatory: boolean;
  onToggleInvolved: (id: string, value: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-2.5">
        <StepNode status={status} index={index} />
      </div>

      <Card
        className={cn(
          "flex-1 transition-all",
          status === "muted" && "opacity-60 saturate-0",
        )}
      >
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div
            className={cn(
              "bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md",
              status === "start" && "bg-primary text-primary-foreground",
              status === "active" && "bg-secondary text-secondary-foreground",
              status === "done" && "bg-primary/10 text-primary",
            )}
          >
            <HugeiconsIcon icon={job.icon} className="size-4" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{job.title}</p>
            <p className="text-muted-foreground truncate text-xs">
              {job.description}
            </p>
          </div>
          {!mandatory && (
            <Switch
              checked={involved}
              onCheckedChange={(value) => onToggleInvolved(job.id, value)}
              aria-label={`Toggle ${job.title} involvement`}
              title={`Toggle ${job.title} involvement`}
            />
          )}
        </CardHeader>

        <CardContent>
          <div
            className={cn(
              !involved && "pointer-events-none opacity-60 saturate-0",
            )}
          >
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
