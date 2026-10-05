/** Sent with every title extraction. Editable in settings. */
export const DEFAULT_TITLE_EXTRACTION_PROMPT = `bookName is the complete main title only, in the cover's language.

Identify all words and lines that together form the main title as a single semantic title unit. Do not rely on font size alone.

Include smaller, upper, preceding, or differently styled text when it is genuinely part of the main title.
For example:
- "Get ahead! MEDICINE" → "Get ahead! MEDICINE"
- "Yen & Jaffe's Reproductive Endocrinology" → "Yen & Jaffe's Reproductive Endocrinology"

Exclude subtitles and descriptive or supporting text that explains the book's content, scope, audience, purpose, format, or features, even when it appears directly below the main title.
For example:
- "Get ahead! MEDICINE — 150 EMQs for finals" → "Get ahead! MEDICINE"

Also exclude taglines, edition statements, series labels, translators, and publishers.

Do not classify text as a subtitle or series name merely because it is smaller, placed above or below other title text, or styled differently. Determine its role from its wording, semantic relationship, typography, and layout together.

When multiple lines form the main title, join them in reading order.

For Arabic and other right-to-left scripts, use logical reading order (the first spoken word first), never the visual left-to-right order. When the title spans several lines, join the title lines from top to bottom.`;

/** Appended when the cover also needs a back-cover blurb. Editable in settings. */
export const DEFAULT_DESCRIPTION_EXTRACTION_PROMPT = `description is a back-cover blurb of 100 to 110 words, written as one paragraph in the same language as the title. Base it on the cover, and do not repeat the title.`;

/** The title prompt shipped before author and editor names stayed in the title. */
const PREVIOUS_TITLE_EXTRACTION_PROMPT = `bookName is the complete main title only, in the cover's language.

Identify all words and lines that together form the main title as a single semantic title unit. Do not rely on font size alone.

Include smaller, upper, preceding, or differently styled text when it is genuinely part of the main title.
For example:
- "Get ahead! MEDICINE" → "Get ahead! MEDICINE"
- "Yen & Jaffe's Reproductive Endocrinology" → "Yen & Jaffe's Reproductive Endocrinology"

Exclude subtitles and descriptive or supporting text that explains the book's content, scope, audience, purpose, format, or features, even when it appears directly below the main title.
For example:
- "Get ahead! MEDICINE — 150 EMQs for finals" → "Get ahead! MEDICINE"

Also exclude taglines, edition statements, series labels, author names, editor names, translators, and publishers.

Do not classify text as a subtitle, series name, or author name merely because it is smaller, placed above or below other title text, or styled differently. Determine its role from its wording, semantic relationship, typography, and layout together.

When multiple lines form the main title, join them in reading order.

For Arabic and other right-to-left scripts, use logical reading order (the first spoken word first), never the visual left-to-right order. When the title spans several lines, join the title lines from top to bottom.`;

/** Replaces a stored copy of the previous built-in title prompt. */
export function migrateTitleExtractionPrompt(value: unknown) {
  if (typeof value !== "string") return DEFAULT_TITLE_EXTRACTION_PROMPT;
  if (value.trim() === PREVIOUS_TITLE_EXTRACTION_PROMPT.trim()) {
    return DEFAULT_TITLE_EXTRACTION_PROMPT;
  }
  return value;
}

/** A cleared field keeps extracting with the built-in wording. */
export function promptOrDefault(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}
