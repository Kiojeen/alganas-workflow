import { useEffect, useMemo, useRef, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";

import { ConfigureStep } from "./components/configure-step";
import { FetchInputStep } from "./components/fetch-input-step";
import { WorkflowControls } from "./components/workflow-controls";
import { WorkflowStep } from "./components/workflow-step";
import { useModels } from "./context";
import { JOBS } from "./jobs";
import { renderPdfPage } from "./lib/pdf";
import type { Preview, RunState, StepStatus } from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Workflow() {
  const { models } = useModels();

  const [startId, setStartId] = useState<string>(JOBS[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState("");
  const [prompt, setPrompt] = useState(
    "Enhance this artwork for print: fix contrast, remove noise, and export at 300dpi.",
  );

  const [runState, setRunState] = useState<RunState>("idle");
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const startIndex = useMemo(
    () =>
      Math.max(
        0,
        JOBS.findIndex((j) => j.id === startId),
      ),
    [startId],
  );

  const previewUrlRef = useRef<string | null>(null);
  useEffect(() => {
    previewUrlRef.current = preview?.url ?? null;
  }, [preview]);

  const activeCount = JOBS.length - startIndex;
  const progress = Math.round((activeCount / JOBS.length) * 100);
  const canRun = runState !== "running" && preview !== null;

  const resetRun = () => {
    setRunState("idle");
    setRunningStep(null);
    setCompleted(new Set());
    setOutputImage(null);
  };

  const handleFile = async (f: File | null) => {
    if (!f) return;
    resetRun();
    setBusy(true);
    try {
      if (f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        setPreview((prev) => {
          if (prev?.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
          return { kind: "image", url, name: f.name };
        });
        setFile(f);
        return;
      }

      if (f.type === "application/pdf") {
        setFile(f);
        setPdfPage(1);
        const url = await renderPdfPage(f, 1);
        setPreview((prev) => {
          if (prev?.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
          return { kind: "pdf", url, name: f.name };
        });
        return;
      }

      setPreview(null);
      setFile(null);
    } finally {
      setBusy(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfPage(page);
    setBusy(true);
    try {
      const url = await renderPdfPage(file, page);
      setPreview((prev) => {
        if (prev?.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
        return { kind: "pdf", url, name: file.name };
      });
    } catch {
      // ignore render failure
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    if (runState === "running") return;
    setRunState("running");
    setCompleted(new Set());
    setOutputImage(null);

    for (let i = startIndex; i < JOBS.length; i++) {
      setRunningStep(i);
      await delay(900);
      setCompleted((prev) => new Set(prev).add(i));
      if (i === 1) setOutputImage(previewUrlRef.current);
    }

    setRunningStep(null);
    setRunState("done");
  };

  const statusOf = (i: number): StepStatus => {
    if (i < startIndex) return "muted";
    if (completed.has(i) || runState === "done") return "done";
    if (runState === "running" && runningStep === i) return "running";
    if (i === startIndex) return "start";
    return "active";
  };

  return (
    <>
      <SiteHeader title="Dummy Workflow" />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-auto p-4">
        <WorkflowControls
          startId={startId}
          onStartChange={setStartId}
          activeCount={activeCount}
          progress={progress}
          runState={runState}
          onRun={run}
          onReset={resetRun}
          canRun={canRun}
        />

        <ol className="flex flex-col">
          {JOBS.map((job, i) => {
            const status = statusOf(i);
            const muted = status === "muted";

            return (
              <WorkflowStep key={job.id} job={job} index={i} status={status}>
                {job.id === "fetch" && (
                  <FetchInputStep
                    preview={preview}
                    pdfPage={pdfPage}
                    busy={busy}
                    onFile={handleFile}
                    onPageChange={handlePageChange}
                    disabled={muted}
                  />
                )}

                {job.id === "configure" && (
                  <ConfigureStep
                    ai={ai}
                    onAiChange={(id) => {
                      setAi(id);
                      resetRun();
                    }}
                    prompt={prompt}
                    onPromptChange={(value) => {
                      setPrompt(value);
                      resetRun();
                    }}
                    outputImage={outputImage}
                    disabled={muted}
                  />
                )}
              </WorkflowStep>
            );
          })}
        </ol>

        <Separator />

        <p className="text-muted-foreground pb-2 text-center text-xs">
          This is a UI demo. Steps 1–2 are wired; the rest simulate execution.
        </p>
      </div>
    </>
  );
}
