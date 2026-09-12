import {
  DatabaseIcon,
  PlayCircleIcon,
  RefreshIcon,
  Rocket01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import type { Job } from "./types";

export const JOBS: Job[] = [
  {
    id: "upload",
    title: "إعداد غلاف الكتاب",
    description: "ارفع ملفًا وحدّد إعدادات الغلاف (الصفحات، الفصول، التسمية، نوع الغلاف).",
    icon: DatabaseIcon,
    autoRun: false,
  },
  {
    id: "configure",
    title: "توليد الصور بالذكاء الاصطناعي",
    description: "اختر نموذجًا وعدّل البرومبت الذي سيعالجه.",
    icon: SparklesIcon,
    autoRun: false,
  },
  {
    id: "transform",
    title: "تحويل",
    description: "ربط الحقول وتطبيع البنية.",
    icon: RefreshIcon,
    autoRun: true,
  },
  {
    id: "enrich",
    title: "إثراء",
    description: "تعزيز السجلات بإشارات خارجية.",
    icon: SparklesIcon,
    autoRun: true,
  },
  {
    id: "review",
    title: "مراجعة",
    description: "خطوة مراجعة يدوية قبل النشر.",
    icon: PlayCircleIcon,
    autoRun: true,
  },
  {
    id: "publish",
    title: "نشر",
    description: "إرسال النتيجة إلى الخدمة اللاحقة.",
    icon: Rocket01Icon,
    autoRun: true,
  },
];
