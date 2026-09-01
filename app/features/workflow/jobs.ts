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
    title: "رفع ملف",
    description: "ارفع صورة أو ملف PDF (تصبح صفحة واحدة هي العمل الفني).",
    icon: DatabaseIcon,
  },
  {
    id: "configure",
    title: "إعداد الذكاء الاصطناعي",
    description: "اختر نموذجًا وعدّل البرومبت الذي سيعالجه.",
    icon: SparklesIcon,
  },
  {
    id: "transform",
    title: "تحويل",
    description: "ربط الحقول وتطبيع البنية.",
    icon: RefreshIcon,
  },
  {
    id: "enrich",
    title: "إثراء",
    description: "تعزيز السجلات بإشارات خارجية.",
    icon: SparklesIcon,
  },
  {
    id: "review",
    title: "مراجعة",
    description: "خطوة مراجعة يدوية قبل النشر.",
    icon: PlayCircleIcon,
  },
  {
    id: "publish",
    title: "نشر",
    description: "إرسال النتيجة إلى الخدمة اللاحقة.",
    icon: Rocket01Icon,
  },
];
