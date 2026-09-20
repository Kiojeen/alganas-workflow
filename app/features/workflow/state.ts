import { JOBS } from "./jobs";
import type { BookConfig, Preview } from "./types";

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
  bookConfig: BookConfig;
  canvasImage: string | null;
};

const defaultBookConfig: BookConfig = {
  numPages: 720,
  multiChapter: false,
  maxPagesPerChapter: 720,
  chapterLabel: "الفصل",
  bookName: "",
  bookDescription: "",
  coverSide: "rtl",
  coverColor: "",
  stripeForeground: "#f4efe6",
  chapterLabelColor: "#ffffff",
  spineMarkColor: "",
  chapterLabelX: 50,
  chapterLabelY: 88,
};

export function createDefaultWorkflowState(
  jobIds: readonly string[] = JOBS.map((j) => j.id),
): WorkflowState {
  return {
    file: null,
    pdfPage: 1,
    preview: null,
    busy: false,
    ai: "",
    describeAi: "",
    prompt:
      "Extend the book cover seamlessly to fit an A4 portrait canvas. Preserve the original cover exactly as it is, including all text, typography, logos, illustrations, and layout. Only generate new content in the empty areas outside the original image by naturally extending the existing background, colors, textures, patterns, and design elements. Match the original artistic style, lighting, and composition. Do not crop, redraw, modify, or replace any part of the original cover.",
    runningStep: null,
    completed: new Set(),
    outputImage: null,
    involved: new Set(jobIds),
    bookConfig: { ...defaultBookConfig },
    canvasImage: null,
  };
}
