import { useEffect, useMemo, useRef } from "react";

import { Separator } from "@/components/ui/separator";

import { ConfigureStep } from "./components/configure-step";
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
  useEffect(() => {
    fileRef.current = workflow?.state.file ?? null;
  }, [workflow?.state.file]);

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
    runState,
    runningStep,
    completed,
    outputImage,
    involved,
  } = state;

  const firstInvolved = involvedIndices[0] ?? 0;
  const involvedCount = involvedIndices.length;
  const completedCount = involvedIndices.filter((i) => completed.has(i)).length;
  const progress =
    runState === "idle"
      ? Math.round((involvedCount / JOBS.length) * 100)
      : Math.round((completedCount / Math.max(1, involvedCount)) * 100);
  const canRun = runState !== "running" && preview !== null;

  const resetRun = () =>
    update({
      runState: "idle",
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
        runState: "idle",
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

  const run = async () => {
    if (runState === "running") return;
    update({
      runState: "running",
      completed: new Set(),
      outputImage: null,
    });
    for (const i of involvedIndices) {
      update({ runningStep: i });
      await delay(900);
      update((prev) => ({ completed: new Set(prev.completed).add(i) }));
      if (JOBS[i].id === "configure") {
        update((prev) => ({ outputImage: prev.preview?.url ?? null }));
      }
    }
    update({ runningStep: null, runState: "done" });
  };

  const statusOf = (i: number): StepStatus => {
    if (!involved.has(JOBS[i].id)) return "muted";
    if (completed.has(i) || runState === "done") return "done";
    if (runState === "running" && runningStep === i) return "running";
    if (i === firstInvolved) return "start";
    return "active";
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-auto p-4">
      <WorkflowControls
        involvedCount={involvedCount}
        total={JOBS.length}
        progress={progress}
        runState={runState}
        onRun={run}
        onReset={resetRun}
        canRun={canRun}
      />

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
            >
              {job.id === "upload" && (
                <UploadFileStep
                  preview={preview}
                  pdfPage={state.pdfPage}
                  busy={busy}
                  onFile={handleFile}
                  onPageChange={handlePageChange}
                  disabled={!isInvolved}
                />
              )}

              {job.id === "configure" && (
                <ConfigureStep
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
