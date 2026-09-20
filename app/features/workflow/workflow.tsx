import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateImage, generateObject } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { toast } from "sonner";
import { z } from "zod";

import { Separator } from "@/components/ui/separator";

import { ConvertStep } from "./components/convert-step";
import { DescribeStep } from "./components/describe-step";
import { GenerateStep } from "./components/generate-step";
import { UploadFileStep } from "./components/upload-file-step";
import { StepContainer } from "./components/step-container";
import { WorkflowHeaderCard } from "./components/workflow-header-card";
import { useWorkflow } from "./context";
import { useModels } from "./context/models-context";
import { JOBS } from "./jobs";
import { exportCoverPdf } from "./lib/export-cover-pdf";
import { renderPdfPage } from "./lib/pdf";
import { modelsByKind } from "./lib/provider-models";
import type { StepStatus } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const describeSchema = z.object({
  bookName: z.string(),
  description: z.string(),
});

function languageModel(provider: "openai" | "google", key: string, modelId: string) {
  return provider === "openai"
    ? createOpenAI({ apiKey: key })(modelId)
    : createGoogle({ apiKey: key })(modelId);
}

function imageModel(provider: "openai" | "google", key: string, modelId: string) {
  return provider === "openai"
    ? createOpenAI({ apiKey: key }).image(modelId)
    : createGoogle({ apiKey: key }).image(modelId);
}

export function Workflow({ workflowId }: { workflowId: string }) {
  const workflow = useWorkflow(workflowId);
  const { models, keys } = useModels();
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
    describeAi,
    prompt,
    runningStep,
    completed,
    outputImage,
    involved,
    bookConfig,
  } = state;

  const textModels = modelsByKind(models, "text");
  const imageModels = modelsByKind(models, "image");
  const selectedDescribeModel =
    textModels.find((m) => m.id === describeAi) ?? textModels[0];
  const selectedImageModel =
    imageModels.find((m) => m.id === ai) ?? imageModels[0];
  const generateInvolved = involved.has("generate");
  const sourceImage = generateInvolved
    ? outputImage
    : (outputImage ?? preview?.url ?? null);

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
      toast.error(
        generateInvolved
          ? "شغّل توليد الصورة أولاً قبل التصدير."
          : "ارفع صورة غلاف أولاً.",
      );
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

  const rerunStep = (i: number) => {
    if (runningRef.current !== null) return;
    if (!involvedRef.current.has(JOBS[i].id)) return;
    const generateIdx = JOBS.findIndex((job) => job.id === "generate");
    const nextCompleted = new Set(completedRef.current);
    for (const idx of [...nextCompleted]) {
      if (idx >= i) nextCompleted.delete(idx);
    }
    completedRef.current = nextCompleted;
    update({
      completed: nextCompleted,
      runningStep: null,
      ...(generateIdx >= i ? { outputImage: null } : {}),
    });
    void delay(50).then(() => runStep(i));
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

    if (JOBS[i].id === "describe") {
      try {
        if (!selectedDescribeModel) {
          throw new Error("اختر نموذج نص/رؤية من القائمة.");
        }
        const apiKey = keys[selectedDescribeModel.provider]?.trim();
        if (!apiKey) {
          throw new Error("أضف مفتاح API من الإعدادات.");
        }
        if (!preview?.url) {
          throw new Error("ارفع صورة في الخطوة الأولى قبل الاستخراج.");
        }

        const imageBuffer = await fetch(preview.url).then((r) =>
          r.arrayBuffer(),
        );
        const imageBytes = new Uint8Array(imageBuffer);
        const result = await generateObject({
          model: languageModel(
            selectedDescribeModel.provider,
            apiKey,
            selectedDescribeModel.modelId,
          ),
          schema: describeSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Look at this book cover image. Infer a fitting book title and a back-cover description (one short paragraph). Match the language of any visible text on the cover when possible. Return JSON with bookName and description only.",
                },
                { type: "image", image: imageBytes },
              ],
            },
          ],
        });

        runningRef.current = null;
        const nextIdx = findNextInvolved(i, involvedRef.current);
        const shouldAutoRun =
          nextIdx !== null && (JOBS[nextIdx].autoRun ?? true);
        update((prev) => {
          const next = new Set(prev.completed).add(i);
          return {
            completed: next,
            runningStep: null,
            bookConfig: {
              ...prev.bookConfig,
              bookName: result.object.bookName.trim(),
              bookDescription: result.object.description.trim(),
            },
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
            : "فشل استخراج اسم الكتاب والوصف.",
        );
      }
      return;
    }

    if (JOBS[i].id === "generate") {
      try {
        if (!selectedImageModel) {
          throw new Error("اختر نموذج توليد صور من القائمة.");
        }
        const apiKey = keys[selectedImageModel.provider]?.trim();
        if (!apiKey) {
          throw new Error("أضف مفتاح API من الإعدادات.");
        }
        if (!preview?.url) {
          throw new Error("ارفع صورة في الخطوة الأولى قبل التوليد.");
        }

        const model = imageModel(
          selectedImageModel.provider,
          apiKey,
          selectedImageModel.modelId,
        ) as any;

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
    if (id === JOBS[0].id || id === "convert") return;
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
              mandatory={job.id === "upload" || job.id === "convert"}
              hideRun={job.id === "convert"}
              allowRerun={job.id === "describe" || job.id === "generate"}
              lockContent={job.id === "describe" ? false : !isInvolved}
              onToggleInvolved={toggleInvolved}
              onRun={() => runStep(i)}
              onRerun={() => rerunStep(i)}
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

              {job.id === "describe" && (
                <DescribeStep
                  ai={describeAi}
                  onAiChange={(id) => {
                    update({ describeAi: id });
                  }}
                  bookName={bookConfig.bookName}
                  description={bookConfig.bookDescription ?? ""}
                  onBookNameChange={(value) =>
                    handleBookConfigChange({ ...bookConfig, bookName: value })
                  }
                  onDescriptionChange={(value) =>
                    handleBookConfigChange({
                      ...bookConfig,
                      bookDescription: value,
                    })
                  }
                  extractEnabled={isInvolved}
                />
              )}

              {job.id === "generate" && (
                <GenerateStep
                  ai={ai}
                  onAiChange={(id) => {
                    update({ ai: id });
                  }}
                  prompt={prompt}
                  onPromptChange={(value) => {
                    update({ prompt: value });
                  }}
                  outputImage={outputImage}
                  bookName={bookConfig.bookName}
                  disabled={!isInvolved}
                />
              )}

              {job.id === "convert" && (
                <ConvertStep
                  disabled={!isInvolved}
                  sourceImage={sourceImage}
                  awaitingGeneratedCover={generateInvolved && !outputImage}
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
