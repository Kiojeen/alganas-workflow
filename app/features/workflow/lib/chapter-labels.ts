export type ChapterLabelId =
  | "ar:جزء"
  | "ar:مجلد"
  | "ar:فصل"
  | "en:Chapter"
  | "en:Volume"
  | "en:Part";

export const ARABIC_CHAPTER_LABELS: { id: ChapterLabelId; label: string }[] = [
  { id: "ar:جزء", label: "الجزء" },
  { id: "ar:مجلد", label: "المجلد" },
  { id: "ar:فصل", label: "الفصل" },
];

export const ENGLISH_CHAPTER_LABELS: { id: ChapterLabelId; label: string }[] = [
  { id: "en:Chapter", label: "Chapter" },
  { id: "en:Volume", label: "Volume" },
  { id: "en:Part", label: "Part" },
];

const LABEL_WORDS: Record<ChapterLabelId, string> = {
  "ar:جزء": "الجزء",
  "ar:مجلد": "المجلد",
  "ar:فصل": "الفصل",
  "en:Chapter": "Chapter",
  "en:Volume": "Volume",
  "en:Part": "Part",
};

const UNITS = [
  "",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
];

const TEENS = [
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
  "الثالث عشر",
  "الرابع عشر",
  "الخامس عشر",
  "السادس عشر",
  "السابع عشر",
  "الثامن عشر",
  "التاسع عشر",
];

const TENS = [
  "",
  "",
  "العشرون",
  "الثلاثون",
  "الأربعون",
  "الخمسون",
  "الستون",
  "السبعون",
  "الثمانون",
  "التسعون",
];

const COMPOUND_UNITS = [
  "",
  "الحادي",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
];

export function arabicOrdinal(n: number): string {
  const value = Math.floor(n);
  if (value <= 0) return String(n);
  if (value < 10) return UNITS[value];
  if (value < 20) return TEENS[value - 10];
  if (value === 100) return "المئة";
  if (value > 100) return String(value);

  const tens = Math.floor(value / 10);
  const units = value % 10;
  if (units === 0) return TENS[tens];
  return `${COMPOUND_UNITS[units]} و${TENS[tens]}`;
}

export function normalizeChapterLabelId(value: string | null | undefined): ChapterLabelId {
  switch ((value ?? "").trim()) {
    case "ar:جزء":
    case "الجزء":
      return "ar:جزء";
    case "ar:مجلد":
    case "المجلد":
      return "ar:مجلد";
    case "ar:فصل":
    case "الفصل":
      return "ar:فصل";
    case "en:Volume":
    case "volume":
    case "Volume":
      return "en:Volume";
    case "en:Part":
    case "part":
    case "Part":
      return "en:Part";
    case "en:Chapter":
    case "chapter":
    case "Chapter":
      return "en:Chapter";
    default:
      return "ar:فصل";
  }
}

export function isEnglishChapterLabel(value: string | null | undefined): boolean {
  return normalizeChapterLabelId(value).startsWith("en:");
}

export function formatSpineNumber(
  lang: "ar" | "en" | null | undefined,
  index: number,
) {
  if (lang === "en") return String(index);
  return arabicOrdinal(index);
}

export function formatChapterLabel(
  value: string | null | undefined,
  index: number,
  uppercase = false,
): string {
  const id = normalizeChapterLabelId(value);
  if (id.startsWith("ar:")) {
    return `${LABEL_WORDS[id]} ${arabicOrdinal(index)}`;
  }
  const word = uppercase
    ? LABEL_WORDS[id].toLocaleUpperCase()
    : LABEL_WORDS[id];
  return `${word} ${index}`;
}
