import {
  clampCoverImagePan,
  DEFAULT_CHAPTER_LABEL_SIZE_CM,
  DEFAULT_FRONT_TITLE_SIZE_CM,
} from "./lib/cover-layout";
import {
  DEFAULT_DESCRIBE_MODEL_ID,
  DEFAULT_IMAGE_MODEL_ID,
} from "./lib/provider-models";
import type { BookConfig, CoverKind, Preview } from "./types";

export const DEFAULT_GENERATE_PROMPT =
  "Extend the book cover seamlessly to fit an A4 portrait canvas. Preserve the original cover exactly as it is, including all text, typography, logos, illustrations, and layout. Only generate new content in the empty areas outside the original image by naturally extending the existing background, colors, textures, patterns, and design elements. Match the original artistic style, lighting, and composition. Do not crop, redraw, modify, or replace any part of the original cover.";

export type WorkflowState = {
  file: File | null;
  pdfPage: number;
  preview: Preview | null;
  busy: boolean;
  ai: string;
  describeAi: string;
  prompt: string;
  /** Image generation in flight. */
  generating: boolean;
  /** Which cover the image model is redrawing. */
  generatingSide: "front" | "back";
  /** Title/description extraction in flight. */
  extracting: boolean;
  outputImage: string | null;
  /** Uploaded back cover, used by the double-cover layout. */
  backFile: File | null;
  backPdfPage: number;
  backPreview: Preview | null;
  backBusy: boolean;
  backOutputImage: string | null;
  bookConfig: BookConfig;
};

const defaultBookConfig: BookConfig = {
  numPages: 720,
  division: "pages",
  pagesFill: "even",
  maxPagesPerChapter: 720,
  chapterCount: 1,
  chapterPages: [720],
  chapterNames: [],
  language: "en",
  chapterLabel: "en:Volume",
  chapterLabelUppercase: true,
  bookName: "",
  bookDescription: "",
  coverKind: "wrap",
  binding: "standard",
  premadeCoverId: "",
  imageFromSpine: true,
  imagePanX: 0,
  spineGapFill: "color",
  hideStripe: false,
  coverSide: "ltr",
  pageSize: "a4",
  pageOrientation: "vertical",
  fontPair: "montserrat",
  coverColor: "",
  stripeColor: "",
  stripeForeground: "",
  chapterLabelColor: "",
  chapterLabelContrast: true,
  chapterLabelShadow: true,
  spineMarkColor: "",
  spineTextColor: "",
  forceSpine: false,
  chapterLabelX: 50,
  chapterLabelY: 88,
  chapterLabelSizeCm: DEFAULT_CHAPTER_LABEL_SIZE_CM,
  frontTitleX: 50,
  frontTitleY: 30,
  frontTitleSizeCm: DEFAULT_FRONT_TITLE_SIZE_CM,
  frontTitleAlign: "center",
  frontTitleLeading: 1.25,
  frontTitleColor: "",
  frontTitleContrast: true,
  frontTitleShadow: true,
};

export function createDefaultWorkflowState(
  models: { describeAi?: string; ai?: string } = {},
): WorkflowState {
  return {
    file: null,
    pdfPage: 1,
    preview: null,
    busy: false,
    ai: models.ai || DEFAULT_IMAGE_MODEL_ID,
    describeAi: models.describeAi || DEFAULT_DESCRIBE_MODEL_ID,
    prompt: DEFAULT_GENERATE_PROMPT,
    generating: false,
    generatingSide: "front",
    extracting: false,
    outputImage: null,
    backFile: null,
    backPdfPage: 1,
    backPreview: null,
    backBusy: false,
    backOutputImage: null,
    bookConfig: { ...defaultBookConfig },
  };
}

/** Fills new fields and turns the old single-page cover into spiral binding. */
export function normalizeBookConfig(config: BookConfig): BookConfig {
  const legacyPage = (config.coverKind as CoverKind | "page") === "page";
  const kind = legacyPage
    ? "wrap"
    : config.coverKind === "double" || config.coverKind === "premade"
      ? config.coverKind
      : "wrap";
  const requestedBinding = legacyPage
    ? "spiral"
    : config.binding === "spiral" || config.binding === "hardcover"
      ? config.binding
      : "standard";
  const binding =
    kind === "double" && requestedBinding === "spiral"
      ? "standard"
      : requestedBinding;
  const pageSize = config.pageSize ?? "a4";
  const nextPageSize =
    binding === "hardcover"
      ? pageSize === "b5"
        ? "b5"
        : "a4"
      : pageSize === "b5"
        ? "a4"
        : pageSize;
  return {
    ...defaultBookConfig,
    ...config,
    coverKind: kind,
    binding,
    pageSize: nextPageSize,
    pageOrientation:
      config.pageOrientation === "horizontal" ? "horizontal" : "vertical",
    premadeCoverId: config.premadeCoverId ?? "",
    imageFromSpine: config.imageFromSpine !== false,
    imagePanX: clampCoverImagePan(config.imagePanX),
    spineGapFill: "color",
    hideStripe: config.hideStripe === true,
    frontTitleX: config.frontTitleX ?? defaultBookConfig.frontTitleX,
    frontTitleY: config.frontTitleY ?? defaultBookConfig.frontTitleY,
    frontTitleSizeCm:
      config.frontTitleSizeCm ?? defaultBookConfig.frontTitleSizeCm,
    frontTitleAlign:
      config.frontTitleAlign === "left" || config.frontTitleAlign === "right"
        ? config.frontTitleAlign
        : "center",
    frontTitleLeading:
      typeof config.frontTitleLeading === "number" &&
      Number.isFinite(config.frontTitleLeading)
        ? config.frontTitleLeading
        : defaultBookConfig.frontTitleLeading,
    frontTitleColor: config.frontTitleColor ?? "",
    frontTitleContrast: config.frontTitleContrast !== false,
    frontTitleShadow: config.frontTitleShadow !== false,
  };
}
