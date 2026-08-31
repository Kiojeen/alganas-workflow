import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function renderPdfPage(file: File, page: number): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  try {
    const pageNumber = Math.min(Math.max(1, page), pdf.numPages);
    const pageObj = await pdf.getPage(pageNumber);
    const viewport = pageObj.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");
    await pageObj.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png");
  } finally {
    await (pdf as { destroy?: () => Promise<void> }).destroy?.();
  }
}
