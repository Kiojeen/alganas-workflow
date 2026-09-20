import {
  CheckmarkCircle01Icon,
  CircleLock01Icon,
  Clock01Icon,
  PlayIcon,
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
        تم التخطي
      </Badge>
    );
  }

  if (status === "ready") {
    return (
      <Badge variant="default" className="gap-1">
        <HugeiconsIcon icon={PlayIcon} className="size-2.5" strokeWidth={2} />
        جاهز
      </Badge>
    );
  }

  if (status === "pending") {
    return (
      <Badge
        variant="outline"
        className="border-dashed text-muted-foreground gap-1"
      >
        <HugeiconsIcon icon={Clock01Icon} className="size-2.5" strokeWidth={2} />
        لم تُنفَّذ بعد
      </Badge>
    );
  }

  if (status === "running") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Spinner /> قيد التشغيل
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
        تم
      </Badge>
    );
  }

  return <Badge variant="secondary">نشط</Badge>;
}
