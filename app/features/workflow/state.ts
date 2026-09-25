import { JOBS } from "./jobs";
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
  runningStep: number | null;
  completed: Set<number>;
  outputImage: string | null;
  involved: Set<string>;
  stepAutoRun: Record<string, boolean>;
  bookConfig: BookConfig;
  canvasImage: string | null;
};

const defaultBookConfig: BookConfig = {
  numPages: 720,
  division: "pages",
  maxPagesPerChapter: 720,
  chapterCount: 1,
  chapterPages: [720],
  chapterNames: [],
  chapterLabel: "ar:فصل",
  chapterLabelUppercase: false,
  bookName: "",
  bookDescription: "",
  coverSide: "rtl",
  pageSize: "a4",
  fontPair: "montserrat",
  coverColor: "",
  stripeColor: "",
  stripeForeground: "",
  chapterLabelColor: "",
  spineMarkColor: "",
  chapterLabelX: 50,
  chapterLabelY: 88,
};

export function createDefaultWorkflowState(
  jobIds: readonly string[] = JOBS.map((j) => j.id),
  stepAutoRun: Record<string, boolean> = Object.fromEntries(
    JOBS.map((job) => [job.id, job.autoRun ?? false]),
  ),
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
    runningStep: null,
    completed: new Set(),
    outputImage: null,
    involved: new Set(jobIds),
    stepAutoRun: { ...stepAutoRun },
    bookConfig: { ...defaultBookConfig },
    canvasImage: null,
  };
}
