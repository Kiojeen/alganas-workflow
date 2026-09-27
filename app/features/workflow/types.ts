import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CoverFontPair } from "./lib/cover-fonts";

export type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

export type Job = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: IconType;
};

export type Preview = {
  kind: "image" | "pdf";
  url: string;
  name: string;
};

export type StepStatus =
  | "muted"
  | "waiting"
  | "ready"
  | "pending"
  | "running"
  | "done";

export type CoverSide = "ltr" | "rtl";

export type BookLanguage = "ar" | "en";

export type CoverPageSize = "a4" | "a5";

export type CoverKind = "wrap" | "page";

export type ChapterDivision = "pages" | "chapters";

export type BookConfig = {
  numPages: number;
  division: ChapterDivision;
  maxPagesPerChapter: number;
  chapterCount: number;
  chapterPages: number[];
  chapterNames: string[];
  language: BookLanguage;
  chapterLabel: string;
  chapterLabelUppercase: boolean;
  bookName: string;
  bookDescription: string;
  coverKind: CoverKind;
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

