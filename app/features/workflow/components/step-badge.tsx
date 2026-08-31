import {
  CheckmarkCircle01Icon,
  CircleLock01Icon,
  Flag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

import type { StepStatus } from "../types";

export function StepBadge({ status }: { status: StepStatus }) {
  if (status === "muted") {
    return (
      <Badge variant="outline" className="gap-1">
        <HugeiconsIcon
          icon={CircleLock01Icon}
          className="size-2.5"
          strokeWidth={2}
        />
        Skipped
      </Badge>
    );
  }

  if (status === "start") {
    return (
      <Badge variant="default" className="gap-1">
        <HugeiconsIcon icon={Flag01Icon} className="size-2.5" strokeWidth={2} />
        Start
      </Badge>
    );
  }

  if (status === "running") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Spinner /> Running
      </Badge>
    );
  }

  if (status === "done") {
    return (
      <Badge variant="secondary" className="gap-1">
        <HugeiconsIcon
          icon={CheckmarkCircle01Icon}
          className="size-2.5"
          strokeWidth={2}
        />
        Done
      </Badge>
    );
  }

  return <Badge variant="secondary">Active</Badge>;
}
