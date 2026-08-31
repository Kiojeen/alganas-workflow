import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

export type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

export type Job = {
  id: string;
  title: string;
  description: string;
  icon: IconType;
};

export type Preview = {
  kind: "image" | "pdf";
  url: string;
  name: string;
};

export type RunState = "idle" | "running" | "done";

export type StepStatus = "muted" | "start" | "active" | "running" | "done";
