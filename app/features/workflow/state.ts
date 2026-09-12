import { JOBS } from "./jobs";
import type { BookConfig, Preview } from "./types";

export type WorkflowState = {
  file: File | null;
  pdfPage: number;
  preview: Preview | null;
  busy: boolean;
  ai: string;
  prompt: string;
  runningStep: number | null;
  completed: Set<number>;
  outputImage: string | null;
  involved: Set<string>;
  bookConfig: BookConfig;
};

const defaultBookConfig: BookConfig = {
  numPages: 720,
  numChapters: 1,
  autoChapter: false,
  chapterLabel: "chapter",
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
    prompt:
      "حسّن هذا العمل الفني للطباعة: أصلح التباين، أزل الضوضاء، وصدّر بدقة 300 نقطة في البوصة.",
    runningStep: null,
    completed: new Set(),
    outputImage: null,
    involved: new Set(jobIds),
    bookConfig: { ...defaultBookConfig },
  };
}
