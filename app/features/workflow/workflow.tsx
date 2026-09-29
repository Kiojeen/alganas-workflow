import { useCallback, useEffect, useRef, useState } from "react";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { Download01Icon, RulerIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { generateImage, generateObject } from "ai";
import { toast } from "sonner";
import { z } from "zod";

import { comboText, useShortcuts } from "@/lib/shortcuts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { AiAccordion } from "./components/ai-accordion";
import { CoverPreview } from "./components/cover-preview";
import { DesignStep } from "./components/design-step";
import { StepRail } from "./components/step-panel";
import {
  ACTIVE_TOGGLE_CLASS,
  COVER_FILE_INPUT_ID,
  UploadFileStep,
} from "./components/upload-file-step";
import { useWorkflow } from "./context";
import { useModels } from "./context/models-context";
import { JOBS } from "./jobs";
import { unassignedPagesError } from "./lib/chapter-division";
import { COVER_FONT_PAIRS, getCoverFontPair } from "./lib/cover-fonts";
import { resolveChapters } from "./lib/cover-layout";
import { exportCoverPdf } from "./lib/export-cover-pdf";
import { renderPdfPage } from "./lib/pdf";
import { modelsByKind } from "./lib/provider-models";
import { useCoverImage } from "./lib/use-cover-image";
import { compressForVision } from "./lib/vision-image";
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
  const backFileRef = useRef<File | null>(workflow?.state.backFile ?? null);
  const generatingRef = useRef(false);
  const extractingRef = useRef(false);
  const [showLines, setShowLines] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  // A `U` press from the design tab switches tabs first, then opens the picker.
  const [pendingUpload, setPendingUpload] = useState(false);

  useEffect(() => {
    if (!pendingUpload || activeStep !== UPLOAD) return;
    setPendingUpload(false);
    document.getElementById(COVER_FILE_INPUT_ID)?.click();
  }, [pendingUpload, activeStep]);

  useEffect(() => {
    fileRef.current = workflow?.state.file ?? null;
    backFileRef.current = workflow?.state.backFile ?? null;
  }, [workflow?.state.file, workflow?.state.backFile]);

  const update = workflow?.update;
  const outputImage = workflow?.state.outputImage ?? null;
  const preview = workflow?.state.preview ?? null;
  // The uploaded file shows on the artboard right away; an AI result replaces
  // it until the user removes that result.
  const sourceImage = outputImage ?? preview?.url ?? null;
  const backOutputImage = workflow?.state.backOutputImage ?? null;
  const backPreview = workflow?.state.backPreview ?? null;
  const backSource = backOutputImage ?? backPreview?.url ?? null;
  const { image: coverImage, palette } = useCoverImage(sourceImage);
  const { image: backImage } = useCoverImage(backSource);

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
  const {
    busy,
    ai,
    describeAi,
    prompt,
    generating,
    generatingSide,
    extracting,
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
        backSourceUrl: bookConfig.coverKind === "double" ? backSource : null,
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

  /** Fills the title/description from the uploaded file; false on failure. */
  const extractText = async (): Promise<boolean> => {
    if (extractingRef.current) return false;
    if (!preview?.url) {
      toast.error("ارفع صورة أو ملف PDF أولاً.");
      return false;
    }
    if (!selectedDescribeModel) {
      toast.error("اختر نموذج نص/رؤية من القائمة.");
      return false;
    }
    const apiKey = keys[selectedDescribeModel.provider]?.trim();
    if (!apiKey) {
      toast.error("أضف مفتاح API من الإعدادات.");
      return false;
    }
    extractingRef.current = true;
    update({ extracting: true });
    try {
      // Vision only needs a legible image; a small JPEG costs far fewer tokens.
      const vision = await compressForVision(preview.url);
      const titleOnly =
        bookConfig.coverKind === "page" || bookConfig.coverKind === "double";
      const model = languageModel(
        selectedDescribeModel.provider,
        apiKey,
        selectedDescribeModel.modelId,
      );
      const imagePart = {
        type: "image" as const,
        image: vision.bytes,
        mediaType: vision.mediaType,
      };
      const extracted = titleOnly
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
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "فشل استخراج اسم الكتاب والوصف.",
      );
      return false;
    } finally {
      extractingRef.current = false;
      update({ extracting: false });
    }
  };

  const generateCover = async (side: "front" | "back" = "front") => {
    if (generatingRef.current) return;
    const sourceUrl = side === "back" ? backPreview?.url : preview?.url;
    if (!sourceUrl) {
      toast.error(
        side === "back"
          ? "ارفع صورة الظهر أولاً."
          : "ارفع صورة أو ملف PDF أولاً.",
      );
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
    update({ generating: true, generatingSide: side });
    try {
      const model = imageModel(
        selectedImageModel.provider,
        apiKey,
        selectedImageModel.modelId,
      ) as any;
      const imageBytes = await fetch(sourceUrl).then((r) => r.arrayBuffer());
      const result = await generateImage({
        model,
        prompt: { text: prompt, images: [new Uint8Array(imageBytes)] },
        n: 1,
        maxRetries: 0,
      });
      const imageData = result.images[0];
      const dataUrl = `data:${imageData.mediaType};base64,${imageData.base64}`;
      update(
        side === "back"
          ? { backOutputImage: dataUrl }
          : { outputImage: dataUrl },
      );
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

  const generateBoth = async () => {
    if (await extractText()) await generateCover();
  };

  const removeOutput = (side: "front" | "back" = "front") => {
    update(side === "back" ? { backOutputImage: null } : { outputImage: null });
  };

  const handleFile = async (
    f: File | null,
    side: "front" | "back" = "front",
  ) => {
    if (!f) return;
    const back = side === "back";
    update(
      back
        ? { backFile: f, backPdfPage: 1, backBusy: true, backOutputImage: null }
        : { file: f, pdfPage: 1, busy: true, outputImage: null },
    );
    const clearBusy = back ? { backBusy: false } : { busy: false };
    try {
      if (f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        update((prev) => {
          const current = back ? prev.backPreview : prev.preview;
          if (current?.url.startsWith("blob:"))
            URL.revokeObjectURL(current.url);
          return back
            ? {
                backPreview: { kind: "image", url, name: f.name },
                backBusy: false,
              }
            : { preview: { kind: "image", url, name: f.name }, busy: false };
        });
        return;
      }
      if (f.type === "application/pdf") {
        const url = await renderPdfPage(f, 1);
        update((prev) => {
          const current = back ? prev.backPreview : prev.preview;
          if (current?.url.startsWith("blob:"))
            URL.revokeObjectURL(current.url);
          return back
            ? {
                backPreview: { kind: "pdf", url, name: f.name },
                backBusy: false,
              }
            : { preview: { kind: "pdf", url, name: f.name }, busy: false };
        });
        return;
      }
      toast.error("الملف يجب أن يكون صورة أو PDF.");
      update(clearBusy);
    } catch {
      update(
        back
          ? { backPreview: null, backBusy: false }
          : { preview: null, busy: false },
      );
    }
  };

  const handlePageChange = async (
    page: number,
    side: "front" | "back" = "front",
  ) => {
    const back = side === "back";
    const currentFile = back ? backFileRef.current : fileRef.current;
    if (!currentFile || currentFile.type !== "application/pdf") return;
    update(
      back
        ? { backPdfPage: page, backBusy: true }
        : { pdfPage: page, busy: true },
    );
    try {
      const url = await renderPdfPage(currentFile, page);
      update((prev) => {
        const current = back ? prev.backPreview : prev.preview;
        if (current?.url.startsWith("blob:")) URL.revokeObjectURL(current.url);
        return back
          ? {
              backPreview: { kind: "pdf", url, name: currentFile.name },
              backBusy: false,
            }
          : {
              preview: { kind: "pdf", url, name: currentFile.name },
              busy: false,
            };
      });
    } catch {
      update(back ? { backBusy: false } : { busy: false });
    }
  };

  const statuses: StepStatus[] = JOBS.map((_, i) => {
    if (i === UPLOAD) return preview ? "done" : "waiting";
    if (i === CONVERT) return sourceImage ? "ready" : "pending";
    return "pending";
  });
  const job = JOBS[activeStep];
  const canRunAi = Boolean(preview) && !busy && !generating && !extracting;
  const chapterCount = resolveChapters(bookConfig).length;
  const singlePage = bookConfig.coverKind === "page";
  const canExport =
    Boolean(sourceImage) &&
    !exporting &&
    unassignedPagesError(bookConfig) === null;

  useShortcuts({
    export: () => {
      if (canExport) void exportAll();
    },
    "tab-file": () => setActiveStep(UPLOAD),
    "tab-design": () => setActiveStep(CONVERT),
    guides: () => setShowLines((value) => !value),
    "prev-chapter": () => setChapterIndex((index) => Math.max(0, index - 1)),
    "next-chapter": () =>
      setChapterIndex((index) => Math.min(chapterCount - 1, index + 1)),
    upload: () => {
      setActiveStep(UPLOAD);
      setPendingUpload(true);
    },
    "ai-image": () => {
      if (canRunAi) void generateCover();
    },
    "ai-text": () => {
      if (canRunAi) void extractText();
    },
    "ai-both": () => {
      if (canRunAi) void generateBoth();
    },
  });

  return (
    // `lg:flex-none` keeps the explicit height from acting as a flex basis
    // inside the column layout, so tall tool content scrolls in the aside
    // rather than growing the page.
    <div className="flex min-h-0 w-full flex-1 flex-col lg:h-[calc(100svh-var(--header-height))] lg:flex-none lg:flex-row lg:overflow-hidden">
      <aside className="order-2 flex w-full shrink-0 flex-col lg:order-none lg:h-full lg:w-[26rem] lg:border-e">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <Button
            size="sm"
            disabled={!canExport}
            onClick={() => {
              void exportAll();
            }}
            className="gap-1.5"
            title={`يحفظ صورة الغلاف وملف PDF لكل فصل باسم الكتاب (${comboText("export")})`}
          >
            {exporting ? (
              <Spinner />
            ) : (
              <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
            )}
            تصدير
            {chapterCount > 1 && (
              <span className="opacity-70">({chapterCount})</span>
            )}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                variant="outline"
                pressed={showLines}
                onPressedChange={setShowLines}
                aria-label="الأدلة"
                className={ACTIVE_TOGGLE_CLASS}
              >
                <HugeiconsIcon icon={RulerIcon} className="size-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              الأدلة (لا تُحفظ في التصدير) · {comboText("guides")}
            </TooltipContent>
          </Tooltip>
        </div>

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
                  generating: generating && generatingSide !== "back",
                  extracting,
                  canRunAi,
                  onGenerateImage: () => {
                    void generateCover();
                  },
                  onGenerateText: () => {
                    void extractText();
                  },
                  onGenerateBoth: () => {
                    void generateBoth();
                  },
                  onRemoveOutput: () => removeOutput("front"),
                }}
                back={
                  bookConfig.coverKind === "double"
                    ? {
                        preview: state.backPreview,
                        pdfPage: state.backPdfPage,
                        busy: state.backBusy,
                        onFile: (f) => {
                          void handleFile(f, "back");
                        },
                        onPageChange: (page) => {
                          void handlePageChange(page, "back");
                        },
                        outputImage: state.backOutputImage,
                        generating: generating && generatingSide === "back",
                        extracting: false,
                        canRunAi:
                          Boolean(state.backPreview) &&
                          !state.backBusy &&
                          !generating &&
                          !extracting,
                        onGenerateImage: () => {
                          void generateCover("back");
                        },
                        onGenerateText: () => {},
                        onGenerateBoth: () => {},
                        onRemoveOutput: () => removeOutput("back"),
                      }
                    : undefined
                }
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
                singlePage={singlePage || bookConfig.coverKind === "double"}
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
          backImage={bookConfig.coverKind === "double" ? backImage : null}
          bookConfig={bookConfig}
          chapterIndex={chapterIndex}
          onChapterIndexChange={setChapterIndex}
          showLines={showLines}
        />
      </div>
    </div>
  );
}
