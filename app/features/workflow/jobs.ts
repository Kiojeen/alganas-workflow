import { DatabaseIcon, RefreshIcon, SparklesIcon } from "@hugeicons/core-free-icons";

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
    id: "generate",
    title: "توليد الصور بالذكاء الاصطناعي",
    description:
      "خطوة اختيارية: عدّل الغلاف بنموذج ذكاء اصطناعي وبرومبت. عطّلها لتمرير الصورة مباشرة للتحويل.",
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
