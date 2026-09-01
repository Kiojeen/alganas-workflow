import { JOBS } from "./jobs";
import type { Preview, RunState } from "./types";

export type WorkflowState = {
  file: File | null;
  pdfPage: number;
  preview: Preview | null;
  busy: boolean;
  ai: string;
  prompt: string;
  runState: RunState;
  runningStep: number | null;
  completed: Set<number>;
  outputImage: string | null;
  involved: Set<string>;
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
      "Enhance this artwork for print: fix contrast, remove noise, and export at 300dpi.",
    runState: "idle",
    runningStep: null,
    completed: new Set(),
    outputImage: null,
    involved: new Set(jobIds),
  };
}
