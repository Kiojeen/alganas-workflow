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

export type CoverPageSize = "a4" | "a5" | "b5";

/**
 * `wrap` is front, spine, and description stripe. `double` swaps the stripe
 * for a second image. `premade` is a finished artboard image from the
 * library; only the spine marks, spine text, and front title are added.
 */
export type CoverKind = "wrap" | "double" | "premade";

/**
 * `spiral` prints one page per chapter with no spine. `hardcover` uses the
 * larger artboard and A4 or B5 panels, with a gap between each image and the spine.
 */
export type CoverBinding = "standard" | "spiral" | "hardcover";

/** What fills the strip between a hardcover image and the spine. */
export type SpineGapFill = "color" | "blur";

export type ChapterDivision = "pages" | "chapters";

/** How page-based division sizes chapters: fill each to the cap, or spread evenly. */
export type PagesFill = "max" | "even";

export type BookConfig = {
  numPages: number;
  division: ChapterDivision;
  pagesFill: PagesFill;
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
  binding: CoverBinding;
  /** Library id of the chosen premade cover; empty when none is picked. */
  premadeCoverId: string;
  /**
   * Hardcover only. When set, uploaded images sit against the spine.
   * Otherwise they start 1 cm away from it.
   */
  imageFromSpine: boolean;
  /** Hardcover gap fill. The gap uses the cover color. */
  spineGapFill: SpineGapFill;
  /** Wrap covers only. The description stripe is drawn unless this is set. */
  hideStripe: boolean;
  coverSide: CoverSide;
  pageSize: CoverPageSize;
  fontPair: CoverFontPair;
  coverColor: string;
  stripeColor: string;
  stripeForeground: string;
  chapterLabelColor: string;
  /** Follow the contrast of whatever sits under the chapter label as it moves. */
  chapterLabelContrast: boolean;
  /** Soft shadow behind the chapter label, in the preview and the export. */
  chapterLabelShadow: boolean;
  spineMarkColor: string;
  /** Ink for the spine title and chapter number; empty means contrast with the cover color. */
  spineTextColor: string;
  /** Draw spine text even when the spine is thinner than the minimum. */
  forceSpine: boolean;
  chapterLabelX: number;
  chapterLabelY: number;
  /** Chapter label cap height in centimetres. */
  chapterLabelSizeCm: number;
  /** Book title on the front of a premade cover, as a percentage of the panel. */
  frontTitleX: number;
  frontTitleY: number;
  /** Front title cap height in centimetres. */
  frontTitleSizeCm: number;
  /** How wrapped front-title lines sit against the horizontal position. */
  frontTitleAlign: "left" | "center" | "right";
  /** Distance from one front-title baseline to the next, as a multiple of the size. */
  frontTitleLeading: number;
  frontTitleColor: string;
  /** Follow the contrast of whatever sits under the front title. */
  frontTitleContrast: boolean;
  frontTitleShadow: boolean;
};
