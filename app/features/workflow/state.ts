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
      "حسّن هذا العمل الفني للطباعة: أصلح التباين، أزل الضوضاء، وصدّر بدقة 300 نقطة في البوصة.",
    runState: "idle",
    runningStep: null,
    completed: new Set(),
    outputImage: null,
    involved: new Set(jobIds),
  };
}
