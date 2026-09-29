import { useCallback, useEffect, useRef, useState } from "react";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateImage, generateObject } from "ai";
import { toast } from "sonner";
import { z } from "zod";

import { AiAccordion } from "./components/ai-accordion";
import { CoverPreview } from "./components/cover-preview";
import { DesignStep } from "./components/design-step";
import { StepRail } from "./components/step-panel";
import { UploadFileStep } from "./components/upload-file-step";
import { useWorkflow } from "./context";
import { useModels } from "./context/models-context";
import { JOBS } from "./jobs";
import { COVER_FONT_PAIRS, getCoverFontPair } from "./lib/cover-fonts";
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
const CONVERT = JOBS.findIndex((job) => job.id === "convert");

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
  const generatingRef = useRef(false);
  const extractingRef = useRef(false);
  const [showLines, setShowLines] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);

  useEffect(() => {
    fileRef.current = workflow?.state.file ?? null;
  }, [workflow?.state.file]);

  const update = workflow?.update;
  const outputImage = workflow?.state.outputImage ?? null;
  const preview = workflow?.state.preview ?? null;
  // The uploaded file shows on the artboard right away; an AI result replaces
  // it until the user removes that result.
  const sourceImage = outputImage ?? preview?.url ?? null;
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
      getCoverFontPair(workflow.state.bookConfig.fontPair).category === category
    ) {
      return;
    }
    update((prev) => {
      const nextCategory =
        prev.bookConfig.language === "en" ? "english" : "arabic";
      if (
        getCoverFontPair(prev.bookConfig.fontPair).category === nextCategory
      ) {
        return {};
      }
      const next = COVER_FONT_PAIRS.find(
        (pair) => pair.category === nextCategory,
      );
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
  const { busy, ai, describeAi, prompt, generating, extracting, bookConfig } =
    state;

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

  const exportAll = async () => {
    if (!sourceImage) {
      toast.error("ارفع صورة غلاف أولاً.");
      return;
    }
    setExporting(true);
    try {
      const stripe =
        (bookConfig.pageSize ?? "a4") === "a5" ? stripeA5 : stripeA4;
      await exportCoverPdf({
        sourceUrl: sourceImage,
        bookConfig,
        pagesPerSpineCm,
        stripeWidthCm: stripe.widthCm,
        stripeInsetCm: stripe.insetCm,
        stripeEdgeGapCm: stripe.edgeGapCm,
      });
      toast.success("تم حفظ صورة الغلاف وملفات PDF.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "تعذّر تصدير الغلاف.",
      );
    } finally {
      setExporting(false);
    }
  };

  const extractText = async () => {
    if (extractingRef.current) return;
    if (!preview?.url) {
      toast.error("ارفع صورة أو ملف PDF أولاً.");
      return;
    }
    if (!selectedDescribeModel) {
      toast.error("اختر نموذج نص/رؤية من القائمة.");
      return;
    }
    const apiKey = keys[selectedDescribeModel.provider]?.trim();
    if (!apiKey) {
      toast.error("أضف مفتاح API من الإعدادات.");
      return;
    }
    extractingRef.current = true;
    update({ extracting: true });
    try {
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
                    text: "Look at this book cover image. Infer a fitting book title and a back-cover description of between 100 and 110 words, written as one paragraph. Match the language of any visible text on the cover when possible. Return JSON with bookName and description only.",
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
        bookConfig: {
          ...prev.bookConfig,
          bookName: extracted.bookName.trim(),
          bookDescription: extracted.description.trim(),
        },
      }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "فشل استخراج اسم الكتاب والوصف.",
      );
    } finally {
      extractingRef.current = false;
      update({ extracting: false });
    }
  };

  const generateCover = async () => {
    if (generatingRef.current) return;
    if (!preview?.url) {
      toast.error("ارفع صورة أو ملف PDF أولاً.");
      return;
    }
    if (!selectedImageModel) {
      toast.error("اختر نموذج توليد صور من القائمة.");
      return;
    }
    const apiKey = keys[selectedImageModel.provider]?.trim();
    if (!apiKey) {
      toast.error("أضف مفتاح API من الإعدادات.");
      return;
    }
    generatingRef.current = true;
    update({ generating: true });
    try {
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
      update({
        outputImage: `data:${imageData.mediaType};base64,${imageData.base64}`,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "فشل توليد الصورة. تحقق من النموذج والمفتاح.",
      );
    } finally {
      generatingRef.current = false;
      update({ generating: false });
    }
  };

  const removeOutput = () => {
    update({ outputImage: null });
  };

  const handleFile = async (f: File | null) => {
    if (!f) return;
    update({ file: f, pdfPage: 1, busy: true, outputImage: null });
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

  const statuses: StepStatus[] = JOBS.map((_, i) => {
    if (i === UPLOAD) return preview ? "done" : "waiting";
    if (i === CONVERT) return sourceImage ? "ready" : "pending";
    return "pending";
  });
  const job = JOBS[activeStep];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col lg:h-[calc(100svh-var(--header-height))] lg:flex-row lg:overflow-hidden">
      <aside className="order-2 flex w-full shrink-0 flex-col lg:order-none lg:h-full lg:w-[26rem] lg:border-e">
        <StepRail
          jobs={JOBS}
          statuses={statuses}
          active={activeStep}
          onSelect={setActiveStep}
        />

        <div className="min-h-0 flex-1 p-4 lg:overflow-y-auto">
          {job.id === "upload" && (
            <div className="flex flex-col gap-4">
              <UploadFileStep
                file={{
                  preview,
                  pdfPage: state.pdfPage,
                  busy,
                  onFile: handleFile,
                  onPageChange: handlePageChange,
                  outputImage,
                  generating,
                  canGenerate: Boolean(preview) && !busy,
                  onGenerate: () => {
                    void generateCover();
                  },
                  onRemoveOutput: removeOutput,
                }}
                bookConfig={bookConfig}
                onBookConfigChange={handleBookConfigChange}
                disabled={false}
              />
              <AiAccordion
                describeAi={describeAi}
                onDescribeAiChange={(id) => update({ describeAi: id })}
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
                singlePage={bookConfig.coverKind === "page"}
                canExtract={Boolean(preview) && !busy}
                extracting={extracting}
                onExtract={() => {
                  void extractText();
                }}
                imageAi={ai}
                onImageAiChange={(id) => update({ ai: id })}
                prompt={prompt}
                onPromptChange={(value) => update({ prompt: value })}
              />
            </div>
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
            void exportAll();
          }}
          exporting={exporting}
          onBookConfigChange={handleBookConfigChange}
        />
      </div>
    </div>
  );
}
