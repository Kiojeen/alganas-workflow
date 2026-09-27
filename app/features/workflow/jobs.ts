import {
  DatabaseIcon,
  PaintBrush01Icon,
  SparklesIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons";

import type { Job } from "./types";

export const JOBS: Job[] = [
  {
    id: "upload",
    title: "إعداد غلاف الكتاب",
    shortTitle: "الملف والفصول",
    description:
      "ارفع صورة الغلاف وحدّد عدد الصفحات والفصول وتسمية الفصل.",
    icon: DatabaseIcon,
  },
  {
    id: "describe",
    title: "اسم الكتاب ووصفه",
    shortTitle: "الاسم والوصف",
    description:
      "حرّر اسم الكتاب ووصفه هنا، أو استخرجهما من الغلاف بنموذج رؤية.",
    icon: TextFontIcon,
  },
  {
    id: "generate",
    title: "توليد الصورة بالذكاء الاصطناعي",
    shortTitle: "توليد الصورة",
    description:
      "عدّل الغلاف بنموذج ذكاء اصطناعي وتعليمات. عطّلها لتمرير الصورة مباشرة.",
    icon: SparklesIcon,
  },
  {
    id: "convert",
    title: "تصميم الغلاف",
    shortTitle: "التصميم",
    description:
      "الحجم والخط والألوان وموضع تسمية الفصل. التصدير من لوحة المعاينة.",
    icon: PaintBrush01Icon,
  },
];
