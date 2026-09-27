import { useCallback, useEffect, useRef, useState } from "react";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateImage, generateObject } from "ai";
import { toast } from "sonner";
import { z } from "zod";

import { CoverPreview } from "./components/cover-preview";
import { DescribeStep } from "./components/describe-step";
import { DesignStep } from "./components/design-step";
import { GenerateStep } from "./components/generate-step";
import { RunAllBar, StepRail, StepSection } from "./components/step-panel";
import { UploadFileStep } from "./components/upload-file-step";
import { useWorkflow } from "./context";
import { useModels } from "./context/models-context";
import { JOBS } from "./jobs";
import { COVER_FONT_PAIRS, getCoverFontPair } from "./lib/cover-fonts";
import { downloadDataUrl, fileSafeName } from "./lib/cover-layout";
import { exportCoverPdf } from "./lib/export-cover-pdf";
import { renderPdfPage } from "./lib/pdf";
import { modelsByKind } from "./lib/provider-models";
import { useCoverImage } from "./lib/use-cover-image";
import type { BookConfig, StepStatus } from "./types";

const describeSchema = z.object({
  bookName: z.string(),
  description: z.string(),
});

const titleSchema = z.object({
  bookName: z.string(),
});

const UPLOAD = JOBS.findIndex((job) => job.id === "upload");
const DESCRIBE = JOBS.findIndex((job) => job.id === "describe");
const GENERATE = JOBS.findIndex((job) => job.id === "generate");
const CONVERT = JOBS.findIndex((job) => job.id === "convert");
const AI_STEPS = [DESCRIBE, GENERATE];

function languageModel(
  provider: "openai" | "google",
  key: string,
  modelId: string,
) {
  return provider === "openai"
    ? createOpenAI({ apiKey: key })(modelId)
    : createGoogle({ apiKey: key })(modelId);
}

function imageModel(
  provider: "openai" | "google",
  key: string,
  modelId: string,
) {
  return provider === "openai"
    ? createOpenAI({ apiKey: key }).image(modelId)
    : createGoogle({ apiKey: key }).image(modelId);
}

export function Workflow({ workflowId }: { workflowId: string }) {
  const workflow = useWorkflow(workflowId);
  const {
    models,
    keys,
    pagesPerSpineCm,
    stripeA4,
    stripeA5,
    defaultDescribeModel,
    defaultImageModel,
  } = useModels();
  const fileRef = useRef<File | null>(workflow?.state.file ?? null);
  const runningRef = useRef<Set<number>>(new Set());
  const [showLines, setShowLines] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);

  useEffect(() => {
    fileRef.current = workflow?.state.file ?? null;
  }, [workflow?.state.file]);

  const update = workflow?.update;
  const generateInvolved = workflow?.state.involved.has("generate") ?? false;
  const outputImage = workflow?.state.outputImage ?? null;
  const preview = workflow?.state.preview ?? null;
  const sourceImage = generateInvolved
    ? outputImage
    : (outputImage ?? preview?.url ?? null);
  const { image: coverImage, palette } = useCoverImage(sourceImage);

  useEffect(() => {
    const first = palette[0];
    if (!first || !update) return;
    update((prev) =>
      prev.bookConfig.coverColor
        ? {}
        : { bookConfig: { ...prev.bookConfig, coverColor: first } },
    );
  }, [palette, update]);

  const chapterSignature = workflow
    ? [
        workflow.state.bookConfig.division,
        workflow.state.bookConfig.numPages,
        workflow.state.bookConfig.maxPagesPerChapter,
        workflow.state.bookConfig.chapterCount,
        workflow.state.bookConfig.chapterPages.join(","),
      ].join("|")
    : "";
  useEffect(() => {
    setChapterIndex(0);
  }, [chapterSignature]);

  useEffect(() => {
    if (!update || !workflow) return;
    const category =
      workflow.state.bookConfig.language === "en" ? "english" : "arabic";
    if (
      getCoverFontPair(workflow.state.bookConfig.fontPair).category ===
      category
    ) {
      return;
    }
    update((prev) => {
      const nextCategory =
        prev.bookConfig.language === "en" ? "english" : "arabic";
      if (getCoverFontPair(prev.bookConfig.fontPair).category === nextCategory) {
        return {};
      }
      const next = COVER_FONT_PAIRS.find((pair) => pair.category === nextCategory);
      if (!next) return {};
      return { bookConfig: { ...prev.bookConfig, fontPair: next.id } };
    });
  }, [
    workflow?.state.bookConfig.language,
    workflow?.state.bookConfig.fontPair,
    update,
  ]);

  const handleBookConfigChange = useCallback(
    (config: BookConfig) => {
      update?.({ bookConfig: config });
    },
    [update],
  );

  if (!workflow || !update) return null;
  const { state } = workflow;
  const {
    busy,
    ai,
    describeAi,
    prompt,
    runningSteps,
    completed,
    involved,
    bookConfig,
  } = state;

  const textModels = modelsByKind(models, "text");
  const imageModels = modelsByKind(models, "image");
  const selectedDescribeModel =
    textModels.find((m) => m.id === describeAi) ??
    textModels.find((m) => m.id === defaultDescribeModel) ??
    textModels[0];
  const selectedImageModel =
    imageModels.find((m) => m.id === ai) ??
    imageModels.find((m) => m.id === defaultImageModel) ??
    imageModels[0];

  const setRunning = (i: number, on: boolean) => {
    if (on) runningRef.current.add(i);
    else runningRef.current.delete(i);
    update((prev) => {
      const next = new Set(prev.runningSteps);
      if (on) next.add(i);
      else next.delete(i);
      return { runningSteps: next };
    });
  };

  const markCompleted = (i: number, extra: Partial<typeof state> = {}) => {
    update((prev) => ({
      completed: new Set(prev.completed).add(i),
      ...extra,
    }));
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
      const stripe =
        (bookConfig.pageSize ?? "a4") === "a5" ? stripeA5 : stripeA4;
      await exportCoverPdf({
        sourceUrl: sourceImage,
        bookConfig,
        showGuides: showLines,
        pagesPerSpineCm,
        stripeWidthCm: stripe.widthCm,
        stripeInsetCm: stripe.insetCm,
        stripeEdgeGapCm: stripe.edgeGapCm,
      });
      markCompleted(CONVERT);
      toast.success("تم تصدير ملف PDF.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تعذّر تصدير ملف PDF.",
      );
    } finally {
      setExporting(false);
    }
  };

  const runDescribe = async () => {
    if (!selectedDescribeModel) {
      throw new Error("اختر نموذج نص/رؤية من القائمة.");
    }
    const apiKey = keys[selectedDescribeModel.provider]?.trim();
    if (!apiKey) throw new Error("أضف مفتاح API من الإعدادات.");
    if (!preview?.url) throw new Error("ارفع صورة في الخطوة الأولى.");

    const imageBuffer = await fetch(preview.url).then((r) => r.arrayBuffer());
    const imageBytes = new Uint8Array(imageBuffer);
    const singlePage = bookConfig.coverKind === "page";
    const model = languageModel(
      selectedDescribeModel.provider,
      apiKey,
      selectedDescribeModel.modelId,
    );
    const imagePart = { type: "image" as const, image: imageBytes };
    const extracted = singlePage
      ? await generateObject({
          model,
          schema: titleSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Look at this book cover image. Infer a fitting book title. Match the language of any visible text on the cover when possible. Return JSON with bookName only.",
                },
                imagePart,
              ],
            },
          ],
        }).then((result) => ({
          bookName: result.object.bookName,
          description: "",
        }))
      : await generateObject({
          model,
          schema: describeSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Look at this book cover image. Infer a fitting book title and a back-cover description (one short paragraph). Match the language of any visible text on the cover when possible. Return JSON with bookName and description only.",
                },
                imagePart,
              ],
            },
          ],
        }).then((result) => ({
          bookName: result.object.bookName,
          description: result.object.description,
        }));

    update((prev) => ({
      completed: new Set(prev.completed).add(DESCRIBE),
      bookConfig: {
        ...prev.bookConfig,
        bookName: extracted.bookName.trim(),
        bookDescription: extracted.description.trim(),
      },
    }));
  };

  const runGenerate = async () => {
    if (!selectedImageModel) {
      throw new Error("اختر نموذج توليد صور من القائمة.");
    }
    const apiKey = keys[selectedImageModel.provider]?.trim();
    if (!apiKey) throw new Error("أضف مفتاح API من الإعدادات.");
    if (!preview?.url) throw new Error("ارفع صورة في الخطوة الأولى.");

    const model = imageModel(
      selectedImageModel.provider,
      apiKey,
      selectedImageModel.modelId,
    ) as any;
    const imageBytes = await fetch(preview.url).then((r) => r.arrayBuffer());
    const result = await generateImage({
      model,
      prompt: { text: prompt, images: [new Uint8Array(imageBytes)] },
      n: 1,
      maxRetries: 0,
    });
    const imageData = result.images[0];
    const imageUrl = `data:${imageData.mediaType};base64,${imageData.base64}`;
    const name = fileSafeName(bookConfig.bookName ?? "", "cover");
    const ext = /jpe?g/i.test(imageData.mediaType ?? "") ? "jpg" : "png";
    downloadDataUrl(imageUrl, `${name}.${ext}`);
    markCompleted(GENERATE, { outputImage: imageUrl });
  };

  const runStep = async (i: number) => {
    if (runningRef.current.has(i)) return;
    if (!involved.has(JOBS[i].id)) return;
    if (!preview) {
      toast.error("ارفع صورة أو ملف PDF للمتابعة.");
      return;
    }
    setRunning(i, true);
    try {
      if (i === DESCRIBE) await runDescribe();
      else if (i === GENERATE) await runGenerate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : i === DESCRIBE
            ? "فشل استخراج اسم الكتاب والوصف."
            : "فشل توليد الصورة. تحقق من النموذج والمفتاح.",
      );
    } finally {
      setRunning(i, false);
    }
  };

  const rerunStep = (i: number) => {
    if (runningRef.current.has(i)) return;
    update((prev) => {
      const nextCompleted = new Set(prev.completed);
      nextCompleted.delete(i);
      return {
        completed: nextCompleted,
        ...(i === GENERATE ? { outputImage: null } : {}),
      };
    });
    void runStep(i);
  };

  const enabledAiSteps = AI_STEPS.filter((i) => involved.has(JOBS[i].id));
  const pendingAiSteps = enabledAiSteps.filter((i) => !completed.has(i));
  const anyRunning = runningSteps.size > 0;

  const runAll = async () => {
    if (anyRunning) return;
    if (!preview) {
      toast.error("ارفع صورة أو ملف PDF أولاً.");
      return;
    }
    if (enabledAiSteps.length === 0) {
      toast.message("لا خطوات ذكاء اصطناعي مفعّلة. الصورة المرفوعة تمر مباشرة إلى التصميم.");
      setActiveStep(CONVERT);
      return;
    }
    const targets = pendingAiSteps.length > 0 ? pendingAiSteps : enabledAiSteps;
    if (pendingAiSteps.length === 0) {
      update((prev) => {
        const nextCompleted = new Set(prev.completed);
        for (const i of targets) nextCompleted.delete(i);
        return {
          completed: nextCompleted,
          ...(targets.includes(GENERATE) ? { outputImage: null } : {}),
        };
      });
    }
    await Promise.all(targets.map((i) => runStep(i)));
    setActiveStep(CONVERT);
  };

  const resetRun = () => {
    update({
      completed: new Set(),
      outputImage: null,
      canvasImage: null,
    });
  };

  const toggleInvolved = (id: string, value: boolean) => {
    if (id === JOBS[UPLOAD].id || id === JOBS[CONVERT].id) return;
    const index = JOBS.findIndex((job) => job.id === id);
    update((prev) => {
      const nextInvolved = new Set(prev.involved);
      if (value) nextInvolved.add(id);
      else nextInvolved.delete(id);
      const nextCompleted = new Set(prev.completed);
      if (!value) nextCompleted.delete(index);
      return {
        involved: nextInvolved,
        completed: nextCompleted,
        ...(!value && id === "generate" ? { outputImage: null } : {}),
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
      toast.error("الملف يجب أن يكون صورة أو PDF.");
      update({ busy: false });
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
    if (i === UPLOAD) return preview ? "done" : "waiting";
    if (!involved.has(JOBS[i].id)) return "muted";
    if (i === CONVERT) {
      if (exporting) return "running";
      if (completed.has(i)) return "done";
      return sourceImage ? "ready" : "pending";
    }
    if (runningSteps.has(i)) return "running";
    if (completed.has(i)) return "done";
    return preview ? "ready" : "pending";
  };

  const statuses = JOBS.map((_, i) => statusOf(i));
  const job = JOBS[activeStep];
  const status = statuses[activeStep];
  const isInvolved = involved.has(job.id);
  const isAiStep = AI_STEPS.includes(activeStep);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:h-[calc(100svh-var(--header-height))] lg:flex-row lg:overflow-hidden">
      <aside className="order-2 flex w-full shrink-0 flex-col lg:order-none lg:h-full lg:w-[26rem] lg:border-e">
        <RunAllBar
          enabledSteps={enabledAiSteps.map((i) => JOBS[i])}
          hasFile={Boolean(preview)}
          running={anyRunning}
          allDone={enabledAiSteps.length > 0 && pendingAiSteps.length === 0}
          onRun={() => {
            void runAll();
          }}
        />
        <StepRail
          jobs={JOBS}
          statuses={statuses}
          active={activeStep}
          onSelect={setActiveStep}
        />

        <div className="min-h-0 flex-1 p-4 lg:overflow-y-auto">
          <StepSection
            key={job.id}
            job={job}
            status={status}
            involved={isInvolved}
            mandatory={!isAiStep}
            showRun={isAiStep}
            lockContent={job.id === "describe" ? false : !isInvolved}
            onToggleInvolved={toggleInvolved}
            onRun={() => {
              void runStep(activeStep);
            }}
            onRerun={() => rerunStep(activeStep)}
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
                disabled={false}
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
                singlePage={bookConfig.coverKind === "page"}
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
              <DesignStep
                disabled={false}
                image={coverImage}
                palette={palette}
                bookConfig={bookConfig}
                onBookConfigChange={handleBookConfigChange}
              />
            )}
          </StepSection>
        </div>
      </aside>

      <div className="order-1 flex min-h-0 min-w-0 flex-col border-b lg:order-none lg:h-full lg:flex-1 lg:border-b-0">
        <CoverPreview
          sourceImage={sourceImage}
          image={coverImage}
          bookConfig={bookConfig}
          chapterIndex={chapterIndex}
          onChapterIndexChange={setChapterIndex}
          showLines={showLines}
          onShowLinesChange={setShowLines}
          onExport={() => {
            void exportPdf();
          }}
          exporting={exporting}
          awaitingGeneratedCover={
            generateInvolved && Boolean(preview) && !outputImage
          }
          onBookConfigChange={handleBookConfigChange}
        />
      </div>
    </div>
  );
}
