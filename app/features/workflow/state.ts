import { DEFAULT_CHAPTER_LABEL_SIZE_CM } from "./lib/cover-layout";
import {
  DEFAULT_DESCRIBE_MODEL_ID,
  DEFAULT_IMAGE_MODEL_ID,
} from "./lib/provider-models";
import type { BookConfig, Preview } from "./types";

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
  /** Title/description extraction in flight. */
  extracting: boolean;
  outputImage: string | null;
  bookConfig: BookConfig;
};

const defaultBookConfig: BookConfig = {
  numPages: 720,
  division: "pages",
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
  coverSide: "ltr",
  pageSize: "a4",
  fontPair: "montserrat",
  coverColor: "",
  stripeColor: "",
  stripeForeground: "",
  chapterLabelColor: "",
  spineMarkColor: "",
  spineTextColor: "",
  forceSpine: false,
  chapterLabelX: 50,
  chapterLabelY: 88,
  chapterLabelSizeCm: DEFAULT_CHAPTER_LABEL_SIZE_CM,
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
    extracting: false,
    outputImage: null,
    bookConfig: { ...defaultBookConfig },
  };
}
