import { loadCoverImage } from "./cover-layout";

/**
 * Longest side sent to a vision model. Providers tile images at roughly
 * 512–768 px, so anything larger only adds tokens without adding legibility.
 */
export const VISION_MAX_SIDE = 1024;
export const VISION_JPEG_QUALITY = 0.8;

export type VisionImage = {
  bytes: Uint8Array;
  mediaType: "image/jpeg";
  width: number;
  height: number;
};

/**
 * Downscales and re-encodes an image as a lossy JPEG for reading by a vision
 * model. Used only for extraction; image generation still gets the original.
 */
export async function compressForVision(
  sourceUrl: string,
  maxSide = VISION_MAX_SIDE,
  quality = VISION_JPEG_QUALITY,
): Promise<VisionImage> {
  const image = await loadCoverImage(sourceUrl);
  const scale = Math.min(
    1,
    maxSide / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر تجهيز الصورة للقراءة.");
  // JPEG has no alpha; flatten onto white so transparent PDFs stay readable.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("تعذّر ضغط الصورة للقراءة.");
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    mediaType: "image/jpeg",
    width,
    height,
  };
}
