import {
  DatabaseIcon,
  RefreshIcon,
  SparklesIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";

import type { Job } from "./types";

export const JOBS: Job[] = [
  {
    id: "upload",
    title: "إعداد غلاف الكتاب",
    description:
      "ارفع صورة الغلاف وحدّد عدد الصفحات والفصول وتسمية الفصل.",
    icon: DatabaseIcon,
    autoRun: false,
  },
  {
    id: "describe",
    title: "استخراج اسم الكتاب ووصفه",
    description:
      "أرسل الغلاف إلى Gemini لاستخراج اسم الكتاب ووصف له. يمكن تعطيلها للكتابة يدويًا.",
    icon: TextFontIcon,
    autoRun: false,
  },
  {
    id: "generate",
    title: "توليد الصور بالذكاء الاصطناعي",
    description:
      "عدّل الغلاف بنموذج ذكاء اصطناعي وبرومبت. يمكن تعطيلها لتمرير الصورة مباشرة للتحويل.",
    icon: SparklesIcon,
    autoRun: false,
  },
  {
    id: "convert",
    title: "ترتيب الغلاف وتحويله إلى PDF",
    description:
      "لوحة 47×29.7 سم مع كعب محسوب من عدد الصفحات، وغلاف بحجم A4، ثم تصدير PDF.",
    icon: RefreshIcon,
    autoRun: false,
  },
];
