import { PDFDocument } from "pdf-lib";

import type { BookConfig } from "../types";
import {
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  EXPORT_DPI,
  drawCoverOnCanvas,
  fileSafeName,
  loadCoverImage,
  resolveChapters,
} from "./cover-layout";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function exportCoverPdf(args: {
  sourceUrl: string;
  bookConfig: BookConfig;
  showGuides: boolean;
}) {
  const image = await loadCoverImage(args.sourceUrl);
  const chapters = resolveChapters(args.bookConfig);
  const widthPt = (ARTBOARD_WIDTH_CM / 2.54) * 72;
  const heightPt = (ARTBOARD_HEIGHT_CM / 2.54) * 72;
  const bookTitle = fileSafeName(args.bookConfig.bookName ?? "", "cover");

  for (const [index, chapter] of chapters.entries()) {
    const canvas = document.createElement("canvas");
    drawCoverOnCanvas(canvas, {
      sourceImage: image,
      pages: chapter.pages,
      label: chapter.label,
      bookName: args.bookConfig.bookName ?? "",
      coverSide: args.bookConfig.coverSide ?? "rtl",
      showGuides: args.showGuides,
      dpi: EXPORT_DPI,
      coverColor: args.bookConfig.coverColor,
      stripeForeground: args.bookConfig.stripeForeground,
      chapterLabelColor: args.bookConfig.chapterLabelColor,
      chapterLabelX: args.bookConfig.chapterLabelX ?? 50,
      chapterLabelY: args.bookConfig.chapterLabelY ?? 88,
      stripeText: args.bookConfig.bookDescription,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) resolve(value);
        else reject(new Error("Could not encode cover page"));
      }, "image/png");
    });

    const pdf = await PDFDocument.create();
    const embedded = await pdf.embedPng(await blob.arrayBuffer());
    const page = pdf.addPage([widthPt, heightPt]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: widthPt,
      height: heightPt,
    });

    const bytes = await pdf.save();
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const chapterPart = chapter.label
      ? fileSafeName(chapter.label, `chapter-${chapter.index}`)
      : "";
    const filename =
      chapters.length > 1 && chapterPart
        ? `${bookTitle}-${chapterPart}.pdf`
        : `${bookTitle}.pdf`;
    downloadBlob(new Blob([copy], { type: "application/pdf" }), filename);

    if (index < chapters.length - 1) {
      await delay(350);
    }
  }
}
