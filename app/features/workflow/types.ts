import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import type { CoverFontPair } from "./lib/cover-fonts";

export type IconType = ComponentProps<typeof HugeiconsIcon>["icon"];

export type Job = {
  id: string;
  title: string;
  icon: IconType;
};

export type Preview = {
  kind: "image" | "pdf";
  url: string;
  name: string;
};

export type StepStatus = "waiting" | "ready" | "pending" | "done";

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
  /** Ink for the spine title and chapter number; empty means contrast with the cover color. */
  spineTextColor: string;
  /** Draw the spine even when it is thinner than the minimum. */
  forceSpine: boolean;
  chapterLabelX: number;
  chapterLabelY: number;
  /** Chapter label cap height in centimetres. */
  chapterLabelSizeCm: number;
};
