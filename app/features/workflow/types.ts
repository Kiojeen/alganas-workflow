import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

export type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

export type Job = {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  autoRun?: boolean;
};

export type Preview = {
  kind: "image" | "pdf";
  url: string;
  name: string;
};

export type StepStatus = "muted" | "ready" | "pending" | "running" | "done";

export type CoverSide = "ltr" | "rtl";

export type BookConfig = {
  numPages: number;
  numChapters: number;
  autoChapter: boolean;
  chapterLabel: string;
  bookName: string;
  coverSide: CoverSide;
  coverColor: string;
  stripeForeground: string;
  chapterLabelColor: string;
  chapterLabelX: number;
  chapterLabelY: number;
};

