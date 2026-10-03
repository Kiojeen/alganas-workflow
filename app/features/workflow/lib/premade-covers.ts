import { useSyncExternalStore } from "react";

import {
  ARTBOARD_HEIGHT_CM,
  ARTBOARD_WIDTH_CM,
  artboardCm,
} from "./cover-layout";

/**
 * Finished cover artboards saved on this device. Images are large, so they
 * live in IndexedDB rather than localStorage. A small in-memory snapshot is
 * kept so React can read the list synchronously.
 */

export type PremadeBoard = "standard" | "hardcover";

export type PremadeCover = {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  createdAt: number;
  /** Which artboard this image was saved for. Missing records are standard. */
  board: PremadeBoard;
  /** Small preview, empty until a thumbnail exists. */
  thumbUrl: string;
};

type CoverMeta = Omit<PremadeCover, "thumbUrl" | "board"> & {
  thumb?: Blob;
  board?: PremadeBoard;
};
type CoverFile = { id: string; blob: Blob };
type LegacyCover = Omit<PremadeCover, "thumbUrl" | "board"> & { blob: Blob };

const DB_NAME = "alganas-premade-covers";
const META = "meta";
const FILES = "files";
/** Previous build kept the full image in this store, which made listing slow. */
const LEGACY = "covers";
const DB_VERSION = 2;
const THUMB_SIDE = 480;

/** Accepted deviation from the 47×29.7 artboard ratio. */
const ASPECT_TOLERANCE = 0.02;

export const PREMADE_ASPECT = ARTBOARD_WIDTH_CM / ARTBOARD_HEIGHT_CM;

export function premadeAspectError(
  width: number,
  height: number,
  board: PremadeBoard = "standard",
) {
  if (width <= 0 || height <= 0) return "تعذّر قراءة أبعاد الصورة.";
  const size = artboardCm(board === "hardcover" ? "hardcover" : "standard");
  const aspect = size.width / size.height;
  const ratio = width / height;
  if (Math.abs(ratio - aspect) / aspect > ASPECT_TOLERANCE) {
    return `الصورة ${width}×${height} لا تطابق نسبة اللوحة ${size.width}×${size.height} سم.`;
  }
  return null;
}

let database: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("المتصفح لا يدعم تخزين الأغلفة الجاهزة."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILES)) {
        db.createObjectStore(FILES, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => {
        database = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      database = null;
      reject(request.error ?? new Error("تعذّر فتح قاعدة الأغلفة."));
    };
  });
  return database;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("فشل طلب قاعدة البيانات."));
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return requestToPromise(
    run(db.transaction(storeName, mode).objectStore(storeName)),
  );
}

function toCover(meta: CoverMeta, thumbUrl = ""): PremadeCover {
  return {
    id: meta.id,
    name: meta.name,
    type: meta.type,
    width: meta.width,
    height: meta.height,
    createdAt: meta.createdAt,
    board: meta.board === "hardcover" ? "hardcover" : "standard",
    thumbUrl,
  };
}

let snapshot: PremadeCover[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const thumbUrls = new Map<string, string>();

function emit() {
  for (const listener of listeners) listener();
}

function rememberThumb(id: string, thumb: Blob | undefined) {
  const current = thumbUrls.get(id);
  if (current || !thumb) return current ?? "";
  const url = URL.createObjectURL(thumb);
  thumbUrls.set(id, url);
  return url;
}

function setSnapshot(next: CoverMeta[]) {
  const ids = new Set(next.map((item) => item.id));
  for (const [id, url] of thumbUrls) {
    if (ids.has(id)) continue;
    URL.revokeObjectURL(url);
    thumbUrls.delete(id);
  }
  snapshot = next
    .map((item) => toCover(item, rememberThumb(item.id, item.thumb)))
    .sort((a, b) => a.createdAt - b.createdAt);
  loaded = true;
  emit();
}

async function migrateLegacy() {
  const db = await openDb();
  if (!db.objectStoreNames.contains(LEGACY)) return;
  const rows = (await requestToPromise(
    db.transaction(LEGACY, "readonly").objectStore(LEGACY).getAll(),
  )) as LegacyCover[];
  for (const row of rows) {
    if (!row?.blob) continue;
    const image = await loadImage(row.blob).catch(() => null);
    const thumb = image ? await thumbFromImage(image) : undefined;
    const meta: CoverMeta = {
      id: row.id,
      name: row.name,
      type: row.type,
      width: row.width,
      height: row.height,
      createdAt: row.createdAt,
      thumb,
    };
    await withStore(META, "readwrite", (store) => store.put(meta));
    await withStore(FILES, "readwrite", (store) =>
      store.put({ id: row.id, blob: row.blob } satisfies CoverFile),
    );
    await requestToPromise(
      db.transaction(LEGACY, "readwrite").objectStore(LEGACY).delete(row.id),
    );
  }
}

async function reload() {
  await migrateLegacy().catch(() => undefined);
  const rows = await withStore(META, "readonly", (store) =>
    store.getAll(),
  ).catch(() => [] as CoverMeta[]);
  setSnapshot(rows as CoverMeta[]);
}

function ensureLoaded() {
  if (loaded || loading) return;
  loading = reload().finally(() => {
    loading = null;
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureLoaded();
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: PremadeCover[] = [];

/** Saved premade covers, newest last. Empty until IndexedDB has answered. */
export function usePremadeCovers(): PremadeCover[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}

function loadImage(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذّر قراءة الصورة."));
    };
    image.src = url;
  });
}

function thumbFromImage(image: HTMLImageElement) {
  const scale = Math.min(
    1,
    THUMB_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return Promise.resolve<Blob | undefined>(undefined);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? undefined), "image/jpeg", 0.82);
  });
}

function defaultName(file: File) {
  return file.name.replace(/\.[^.]+$/, "").trim() || "غلاف جاهز";
}

/** Validates the artboard ratio, then stores the image. */
export async function addPremadeCover(
  file: File,
  board: PremadeBoard = "standard",
): Promise<PremadeCover> {
  if (!file.type.startsWith("image/")) {
    throw new Error("الغلاف الجاهز يجب أن يكون صورة.");
  }
  const image = await loadImage(file);
  const aspectError = premadeAspectError(
    image.naturalWidth,
    image.naturalHeight,
    board,
  );
  if (aspectError) throw new Error(aspectError);
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const meta: CoverMeta = {
    id,
    name: defaultName(file),
    type: file.type,
    width: image.naturalWidth,
    height: image.naturalHeight,
    createdAt: Date.now(),
    board,
    thumb: await thumbFromImage(image),
  };
  await withStore(FILES, "readwrite", (store) =>
    store.put({ id, blob: file } satisfies CoverFile),
  );
  await withStore(META, "readwrite", (store) => store.put(meta));
  setSnapshot([...snapshotToMeta(), meta]);
  return toCover(meta, rememberThumb(id, meta.thumb));
}

function snapshotToMeta(): CoverMeta[] {
  return snapshot.map(({ thumbUrl: _thumbUrl, ...meta }) => meta);
}

export async function renamePremadeCover(id: string, name: string) {
  const stored = (await withStore(META, "readonly", (store) =>
    store.get(id),
  )) as CoverMeta | undefined;
  if (!stored) return;
  const next = { ...stored, name };
  await withStore(META, "readwrite", (store) => store.put(next));
  setSnapshot(snapshotToMeta().map((item) => (item.id === id ? next : item)));
}

export async function removePremadeCover(id: string) {
  await withStore(META, "readwrite", (store) => store.delete(id));
  await withStore(FILES, "readwrite", (store) => store.delete(id));
  const full = fileUrls.get(id);
  if (full) {
    URL.revokeObjectURL(full);
    fileUrls.delete(id);
  }
  setSnapshot(snapshotToMeta().filter((item) => item.id !== id));
}

/** The stored image as a File, ready for the usual upload path. */
export async function loadPremadeCoverFile(id: string): Promise<File | null> {
  const stored = (await withStore(FILES, "readonly", (store) =>
    store.get(id),
  )) as CoverFile | undefined;
  if (!stored) return null;
  const meta = snapshot.find((item) => item.id === id);
  const type = meta?.type || stored.blob.type || "image/png";
  const ext = /jpe?g/i.test(type) ? "jpg" : /webp/i.test(type) ? "webp" : "png";
  return new File([stored.blob], `${meta?.name || "cover"}.${ext}`, { type });
}

/** Object URL for the full image. Cached so picking a cover again is instant. */
const fileUrls = new Map<string, string>();

export async function premadeCoverUrl(id: string): Promise<string | null> {
  const cached = fileUrls.get(id);
  if (cached) return cached;
  const stored = (await withStore(FILES, "readonly", (store) =>
    store.get(id),
  )) as CoverFile | undefined;
  if (!stored) return null;
  const url = URL.createObjectURL(stored.blob);
  fileUrls.set(id, url);
  return url;
}
