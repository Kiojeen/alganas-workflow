import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CoverFontPair } from "./lib/cover-fonts";

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

export type CoverPageSize = "a4" | "a5";

export type ChapterDivision = "pages" | "chapters";

export type BookConfig = {
  numPages: number;
  division: ChapterDivision;
  maxPagesPerChapter: number;
  chapterCount: number;
  chapterPages: number[];
  chapterNames: string[];
  chapterLabel: string;
  chapterLabelUppercase: boolean;
  bookName: string;
  bookDescription: string;
  coverSide: CoverSide;
  pageSize: CoverPageSize;
  fontPair: CoverFontPair;
  coverColor: string;
  stripeColor: string;
  stripeForeground: string;
  chapterLabelColor: string;
  spineMarkColor: string;
  chapterLabelX: number;
  chapterLabelY: number;
};

