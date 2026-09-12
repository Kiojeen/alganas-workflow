import { useEffect, useMemo, useRef } from "react";

import { Separator } from "@/components/ui/separator";

import { GenerateStep } from "./components/generate-step";
import { UploadFileStep } from "./components/upload-file-step";
import { StepContainer } from "./components/step-container";
import { WorkflowControls } from "./components/workflow-controls";
import { useWorkflow } from "./context";
import { JOBS } from "./jobs";
import { renderPdfPage } from "./lib/pdf";
import type { StepStatus } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Workflow({ workflowId }: { workflowId: string }) {
  const workflow = useWorkflow(workflowId);
  const fileRef = useRef<File | null>(workflow?.state.file ?? null);
  const involvedRef = useRef<Set<string>>(workflow?.state.involved ?? new Set());
  const completedRef = useRef<Set<number>>(
    workflow?.state.completed ?? new Set(),
  );
  const runningRef = useRef<number | null>(workflow?.state.runningStep ?? null);
  useEffect(() => {
    fileRef.current = workflow?.state.file ?? null;
  }, [workflow?.state.file]);
  useEffect(() => {
    involvedRef.current = workflow?.state.involved ?? new Set();
  }, [workflow?.state.involved]);
  useEffect(() => {
    completedRef.current = workflow?.state.completed ?? new Set();
  }, [workflow?.state.completed]);
  useEffect(() => {
    runningRef.current = workflow?.state.runningStep ?? null;
  }, [workflow?.state.runningStep]);

  const involvedIndices = useMemo(() => {
    const inv = workflow?.state.involved;
    if (!inv) return [];
    return JOBS.map((j, i) => (inv.has(j.id) ? i : -1)).filter((i) => i >= 0);
  }, [workflow?.state.involved]);

  if (!workflow) return null;
  const { state, update } = workflow;
  const {
    file,
    preview,
    busy,
    ai,
    prompt,
    runningStep,
    completed,
    outputImage,
    involved,
    bookConfig,
  } = state;

  const handleBookConfigChange = (config: typeof bookConfig) => {
    update({ bookConfig: config });
  };

  const involvedCount = involvedIndices.length;

  const findNextInvolved = (fromIdx: number, set: Set<string>): number | null => {
    for (let j = fromIdx + 1; j < JOBS.length; j++) {
      if (set.has(JOBS[j].id)) return j;
    }
    return null;
  };

  const runStep = async (i: number) => {
    if (runningRef.current !== null) return;
    if (completedRef.current.has(i)) return;
    if (!involvedRef.current.has(JOBS[i].id)) return;
    // Only allow running the current "ready" step.
    for (let j = 0; j < i; j++) {
      if (
        involvedRef.current.has(JOBS[j].id) &&
        !completedRef.current.has(j)
      ) {
        return;
      }
    }
    update({ runningStep: i });
    await delay(900);
    const nextIdx = findNextInvolved(i, involvedRef.current);
    const shouldAutoRun =
      nextIdx !== null && (JOBS[nextIdx].autoRun ?? true);
    update((prev) => {
      const next = new Set(prev.completed).add(i);
      let outputImage = prev.outputImage;
      if (JOBS[i].id === "configure") {
        outputImage = prev.preview?.url ?? null;
      }
      return { completed: next, runningStep: null, outputImage };
    });
    if (nextIdx !== null && shouldAutoRun) {
      await delay(300);
      runStep(nextIdx);
    }
  };

  const resetRun = () =>
    update({
      runningStep: null,
      completed: new Set(),
      outputImage: null,
    });

  const toggleInvolved = (id: string, value: boolean) => {
    if (id === JOBS[0].id) return; // first step is mandatory
    update((prev) => {
      const nextInvolved = new Set(prev.involved);
      if (value) nextInvolved.add(id);
      else nextInvolved.delete(id);
      return {
        involved: nextInvolved,
        runningStep: null,
        completed: new Set(),
        outputImage: null,
      };
    });
  };

  const handleFile = async (f: File | null) => {
    if (!f) return;
    resetRun();
    update({ file: f, pdfPage: 1, busy: true });
    try {
      if (f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        update((prev) => {
          if (prev.preview?.url.startsWith("blob:"))
            URL.revokeObjectURL(prev.preview.url);
          return { preview: { kind: "image", url, name: f.name }, busy: false };
        });
        return;
      }
      if (f.type === "application/pdf") {
        const url = await renderPdfPage(f, 1);
        update((prev) => {
          if (prev.preview?.url.startsWith("blob:"))
            URL.revokeObjectURL(prev.preview.url);
          return { preview: { kind: "pdf", url, name: f.name }, busy: false };
        });
        return;
      }
      update({ preview: null, file: null, busy: false });
    } catch {
      update({ preview: null, busy: false });
    }
  };

  const handlePageChange = async (page: number) => {
    const file = fileRef.current;
    if (!file || file.type !== "application/pdf") return;
    update({ pdfPage: page, busy: true });
    try {
      const url = await renderPdfPage(file, page);
      update((prev) => {
        if (prev.preview?.url.startsWith("blob:"))
          URL.revokeObjectURL(prev.preview.url);
        return { preview: { kind: "pdf", url, name: file.name }, busy: false };
      });
    } catch {
      update({ busy: false });
    }
  };

  const statusOf = (i: number): StepStatus => {
    if (!involved.has(JOBS[i].id)) return "muted";
    if (completed.has(i)) return "done";
    if (runningStep === i) return "running";
    let allPrevDone = true;
    for (let j = 0; j < i; j++) {
      if (involved.has(JOBS[j].id) && !completed.has(j)) {
        allPrevDone = false;
        break;
      }
    }
    if (allPrevDone) return "ready";
    return "pending";
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-auto p-4">
      <WorkflowControls involvedCount={involvedCount} total={JOBS.length} />

      <div className="flex flex-col gap-3">
        {JOBS.map((job, i) => {
          const status = statusOf(i);
          const isInvolved = involved.has(job.id);

          return (
            <StepContainer
              key={job.id}
              job={job}
              index={i}
              status={status}
              involved={isInvolved}
              mandatory={job.id === JOBS[0].id}
              onToggleInvolved={toggleInvolved}
              onRun={() => runStep(i)}
            >
              {job.id === "upload" && (
                <UploadFileStep
                  preview={preview}
                  pdfPage={state.pdfPage}
                  busy={busy}
                  onFile={handleFile}
                  onPageChange={handlePageChange}
                  bookConfig={bookConfig}
                  onBookConfigChange={handleBookConfigChange}
                  disabled={!isInvolved}
                />
              )}

              {job.id === "configure" && (
                <GenerateStep
                  ai={ai}
                  onAiChange={(id) => {
                    update({ ai: id });
                    resetRun();
                  }}
                  prompt={prompt}
                  onPromptChange={(value) => {
                    update({ prompt: value });
                    resetRun();
                  }}
                  outputImage={outputImage}
                  disabled={!isInvolved}
                />
              )}
            </StepContainer>
          );
        })}
      </div>

      <Separator />
    </div>
  );
}
