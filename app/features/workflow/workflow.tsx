import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateImage } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";

import { ConvertStep } from "./components/convert-step";
import { GenerateStep } from "./components/generate-step";
import { UploadFileStep } from "./components/upload-file-step";
import { StepContainer } from "./components/step-container";
import { WorkflowHeaderCard } from "./components/workflow-header-card";
import { useWorkflow } from "./context";
import { useModels } from "./context/models-context";
import { JOBS } from "./jobs";
import { exportCoverPdf } from "./lib/export-cover-pdf";
import { renderPdfPage } from "./lib/pdf";
import type { StepStatus } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Workflow({ workflowId }: { workflowId: string }) {
  const workflow = useWorkflow(workflowId);
  const { models } = useModels();
  const fileRef = useRef<File | null>(workflow?.state.file ?? null);
  const involvedRef = useRef<Set<string>>(
    workflow?.state.involved ?? new Set(),
  );
  const completedRef = useRef<Set<number>>(
    workflow?.state.completed ?? new Set(),
  );
  const runningRef = useRef<number | null>(workflow?.state.runningStep ?? null);
  const [showLines, setShowLines] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const selectedModel =
    models.find((m) => m.id === ai) ??
    models.find((m) => m.name.trim() && m.key.trim());
  const sourceImage = outputImage ?? preview?.url ?? null;

  const handleBookConfigChange = useCallback(
    (config: typeof bookConfig) => {
      update({ bookConfig: config });
    },
    [update],
  );

  const involvedCount = involvedIndices.length;

  const findNextInvolved = (
    fromIdx: number,
    set: Set<string>,
  ): number | null => {
    for (let j = fromIdx + 1; j < JOBS.length; j++) {
      if (set.has(JOBS[j].id)) return j;
    }
    return null;
  };

  const exportPdf = async () => {
    if (!sourceImage) {
      toast.error("ارفع صورة غلاف أولاً.");
      return;
    }
    setExporting(true);
    try {
      await exportCoverPdf({
        sourceUrl: sourceImage,
        bookConfig,
        showGuides: showLines,
      });
      toast.success("تم تصدير ملف PDF.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تعذّر تصدير ملف PDF.",
      );
      throw error;
    } finally {
      setExporting(false);
    }
  };

  const finishStep = (i: number) => {
    runningRef.current = null;
    const nextIdx = findNextInvolved(i, involvedRef.current);
    const shouldAutoRun = nextIdx !== null && (JOBS[nextIdx].autoRun ?? true);
    update((prev) => {
      const next = new Set(prev.completed).add(i);
      return { completed: next, runningStep: null };
    });
    if (nextIdx !== null && shouldAutoRun) {
      void delay(300).then(() => runStep(nextIdx));
    }
  };

  const runStep = async (i: number) => {
    if (runningRef.current !== null) return;
    if (completedRef.current.has(i)) return;
    if (!involvedRef.current.has(JOBS[i].id)) return;
    for (let j = 0; j < i; j++) {
      if (involvedRef.current.has(JOBS[j].id) && !completedRef.current.has(j)) {
        return;
      }
    }
    update({ runningStep: i });
    runningRef.current = i;

    if (JOBS[i].id === "upload") {
      if (!fileRef.current && !preview) {
        runningRef.current = null;
        update({ runningStep: null });
        toast.error("ارفع صورة أو ملف PDF للمتابعة.");
        return;
      }
      await delay(250);
      finishStep(i);
      return;
    }

    if (JOBS[i].id === "generate") {
      try {
        if (!selectedModel?.key) {
          throw new Error("اختر نموذجًا وأضف مفتاح API من الإعدادات.");
        }
        if (!preview?.url) {
          throw new Error("ارفع صورة في الخطوة الأولى قبل التوليد.");
        }

        const modelId = selectedModel.name.trim();
        const model = modelId.includes("gpt")
          ? (createOpenAI({ apiKey: selectedModel.key }).image(modelId) as any)
          : (createGoogle({ apiKey: selectedModel.key }).image(
              modelId.includes("/") ? modelId.split("/").pop()! : modelId,
            ) as any);

        const imageBytes = await fetch(preview.url).then((r) =>
          r.arrayBuffer(),
        );

        const result = await generateImage({
          model,
          prompt: { text: prompt, images: [new Uint8Array(imageBytes)] },
          n: 1,
          maxRetries: 0,
        });
        const imageData = result.images[0];
        const imageUrl = `data:${imageData.mediaType};base64,${imageData.base64}`;
        runningRef.current = null;
        const nextIdx = findNextInvolved(i, involvedRef.current);
        const shouldAutoRun =
          nextIdx !== null && (JOBS[nextIdx].autoRun ?? true);
        update((prev) => {
          const next = new Set(prev.completed).add(i);
          return {
            completed: next,
            runningStep: null,
            outputImage: imageUrl,
          };
        });
        if (nextIdx !== null && shouldAutoRun) {
          void runStep(nextIdx);
        }
      } catch (error) {
        runningRef.current = null;
        update({ runningStep: null });
        toast.error(
          error instanceof Error
            ? error.message
            : "فشل توليد الصورة. تحقق من النموذج والمفتاح.",
        );
      }
      return;
    }

    if (JOBS[i].id === "convert") {
      try {
        await exportPdf();
        finishStep(i);
      } catch {
        runningRef.current = null;
        update({ runningStep: null });
      }
      return;
    }

    await delay(400);
    finishStep(i);
  };

  const resetRun = () => {
    update({
      runningStep: null,
      completed: new Set(),
      outputImage: null,
      canvasImage: null,
    });
  };

  const toggleInvolved = (id: string, value: boolean) => {
    if (id === JOBS[0].id) return;
    update((prev) => {
      const nextInvolved = new Set(prev.involved);
      if (value) nextInvolved.add(id);
      else nextInvolved.delete(id);
      return {
        involved: nextInvolved,
        runningStep: null,
        completed: new Set(),
        outputImage: null,
        canvasImage: null,
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
    const currentFile = fileRef.current;
    if (!currentFile || currentFile.type !== "application/pdf") return;
    update({ pdfPage: page, busy: true });
    try {
      const url = await renderPdfPage(currentFile, page);
      update((prev) => {
        if (prev.preview?.url.startsWith("blob:"))
          URL.revokeObjectURL(prev.preview.url);
        return {
          preview: { kind: "pdf", url, name: currentFile.name },
          busy: false,
        };
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 overflow-auto p-4">
      <WorkflowHeaderCard involvedCount={involvedCount} total={JOBS.length} />

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

              {job.id === "generate" && (
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

              {job.id === "convert" && (
                <ConvertStep
                  disabled={!isInvolved}
                  sourceImage={sourceImage}
                  bookConfig={bookConfig}
                  onBookConfigChange={handleBookConfigChange}
                  showLines={showLines}
                  setShowLines={setShowLines}
                  onExport={() => {
                    void exportPdf().catch(() => undefined);
                  }}
                  exporting={exporting}
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
