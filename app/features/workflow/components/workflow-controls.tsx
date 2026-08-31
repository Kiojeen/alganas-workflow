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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { JOBS } from "../jobs";
import type { RunState } from "../types";

export function WorkflowControls({
  startId,
  onStartChange,
  activeCount,
  progress,
  runState,
  onRun,
  onReset,
  canRun,
}: {
  startId: string;
  onStartChange: (id: string) => void;
  activeCount: number;
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
            <CardTitle>Order Processing</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {runState === "running" ? (
              <Button variant="outline" size="sm" disabled>
                <Spinner /> Running
              </Button>
            ) : runState === "done" ? (
              <Button variant="outline" size="sm" onClick={onReset}>
                Reset
              </Button>
            ) : (
              <Button size="sm" onClick={onRun} disabled={!canRun}>
                <HugeiconsIcon icon={PlayIcon} className="size-3.5" />
                Run
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Pick a starting job — every step before it is muted and skipped. Press
          Run to execute the active steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-muted-foreground text-xs font-medium">
            Starting job
          </label>
          <div className="flex items-center gap-2">
            <Select value={startId} onValueChange={onStartChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {JOBS.map((job, i) => (
                  <SelectItem key={job.id} value={job.id}>
                    {i + 1}. {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartChange(JOBS[0].id)}
            >
              Reset
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>
              {activeCount} of {JOBS.length} jobs active
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  );
}
