import { useRef, useState } from "react";
import { ModelSelect } from "@/features/workflow/components/model-select";
import { useModels } from "@/features/workflow/context";
import {
  DEFAULT_STRIPE_LAYOUT_A4,
  DEFAULT_STRIPE_LAYOUT_A5,
  PAGES_PER_SPINE_CM,
} from "@/features/workflow/lib/cover-layout";
import { PROVIDERS } from "@/features/workflow/lib/provider-models";
import {
  Delete02Icon,
  Download01Icon,
  Key01Icon,
  PlusSignIcon,
  RulerIcon,
  Settings02Icon,
  SparklesIcon,
  TextFontIcon,
  Upload01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SectionId = "ai" | "layout" | "prompts";

const SECTIONS: { id: SectionId; label: string; icon: typeof Key01Icon }[] = [
  { id: "ai", label: "المفاتيح والنماذج", icon: SparklesIcon },
  { id: "layout", label: "المقاييس", icon: RulerIcon },
  { id: "prompts", label: "التعليمات", icon: TextFontIcon },
];

function AppSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    keys,
    setKey,
    prompts,
    addPrompt,
    updatePrompt,
    removePrompt,
    pagesPerSpineCm,
    setPagesPerSpineCm,
    defaultDescribeModel,
    setDefaultDescribeModel,
    defaultImageModel,
    setDefaultImageModel,
    stripeA4,
    stripeA5,
    updateStripeA4,
    updateStripeA5,
    exportSettings,
    importSettings,
  } = useModels();
  const [section, setSection] = useState<SectionId>("ai");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const importInputRef = useRef<HTMLInputElement>(null);

  const downloadSettings = () => {
    const file = new Blob([JSON.stringify(exportSettings(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "alganas-settings.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!importSettings(parsed)) {
        toast.error("ملف الإعدادات غير صالح.");
        return;
      }
      toast.success("تم استيراد الإعدادات.");
    } catch {
      toast.error("تعذّر قراءة ملف الإعدادات.");
    }
  };

  const missingKeys = PROVIDERS.filter((p) => !keys[p.id].trim()).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(85vh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
              <HugeiconsIcon icon={Settings02Icon} className="size-4" />
            </div>
            <div>
              <DialogTitle>الإعدادات</DialogTitle>
              <DialogDescription>
                تُطبَّق على كل المشاريع وتُحفظ على هذا الجهاز.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav
            className="bg-muted/40 flex shrink-0 gap-1 overflow-x-auto border-b p-2 sm:w-44 sm:flex-col sm:border-e sm:border-b-0"
            aria-label="أقسام الإعدادات"
          >
            {SECTIONS.map((item) => {
              const active = item.id === section;
              const badge =
                item.id === "ai" && missingKeys > 0 ? missingKeys : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                    "hover:bg-background/70 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground",
                  )}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    className="size-4"
                    strokeWidth={2}
                  />
                  <span className="flex-1 text-start">{item.label}</span>
                  {badge !== null && (
                    <span className="bg-destructive text-destructive-foreground rounded-full px-1.5 text-[10px] tabular-nums">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {section === "ai" && (
              <div className="flex flex-col gap-6">
                <Section
                  title="مفاتيح واجهة البرمجة"
                  description="تُحفظ في المتصفح فقط ولا تُرسل إلا إلى مزوّد النموذج."
                >
                  <div className="space-y-2">
                    {PROVIDERS.map((provider) => {
                      const hasKey = keys[provider.id].trim().length > 0;
                      return (
                        <div
                          key={provider.id}
                          className="bg-card flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-md border",
                              hasKey
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <HugeiconsIcon
                              icon={Key01Icon}
                              className="size-4"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">
                                {provider.label}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-medium",
                                  hasKey
                                    ? "text-primary"
                                    : "text-muted-foreground",
                                )}
                              >
                                {hasKey ? "مضبوط" : "بلا مفتاح"}
                              </span>
                            </div>
                            <div className="relative">
                              <Input
                                dir="ltr"
                                type={
                                  revealed[provider.id] ? "text" : "password"
                                }
                                placeholder="sk-…"
                                value={keys[provider.id]}
                                onChange={(e) =>
                                  setKey(provider.id, e.target.value)
                                }
                                className="h-8 pe-8 font-mono text-xs"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealed((prev) => ({
                                    ...prev,
                                    [provider.id]: !prev[provider.id],
                                  }))
                                }
                                aria-label={
                                  revealed[provider.id]
                                    ? "إخفاء المفتاح"
                                    : "إظهار المفتاح"
                                }
                                className="text-muted-foreground hover:text-foreground absolute end-2 top-1/2 -translate-y-1/2"
                              >
                                <HugeiconsIcon
                                  icon={
                                    revealed[provider.id]
                                      ? ViewOffIcon
                                      : ViewIcon
                                  }
                                  className="size-4"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                <Section
                  title="النماذج الافتراضية"
                  description="تُستخدم عند إنشاء مشروع جديد. المشاريع الحالية تحتفظ بالنموذج الذي اختارته."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ModelSelect
                      kind="text"
                      label="استخراج الاسم والوصف"
                      value={defaultDescribeModel}
                      onChange={setDefaultDescribeModel}
                      placeholder="نموذج الرؤية"
                    />
                    <ModelSelect
                      kind="image"
                      label="توليد الصورة"
                      value={defaultImageModel}
                      onChange={setDefaultImageModel}
                      placeholder="نموذج الصور"
                    />
                  </div>
                </Section>
              </div>
            )}

            {section === "layout" && (
              <div className="flex flex-col gap-6">
                <Section
                  title="مقياس الكعب"
                  description="عدد الصفحات التي تعادل 1 سم من عرض الكعب."
                >
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      value={pagesPerSpineCm}
                      onChange={(e) =>
                        setPagesPerSpineCm(
                          Number(e.target.value) || PAGES_PER_SPINE_CM,
                        )
                      }
                      className="h-8 w-32"
                    />
                    <span className="text-muted-foreground text-xs">
                      صفحة لكل سنتيمتر
                    </span>
                  </div>
                </Section>

                <Section
                  title="شريط الظهر"
                  description="العرض، حشوة النص، والمسافة عن حافة الغلاف لكل حجم."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        [
                          "A4",
                          stripeA4,
                          updateStripeA4,
                          DEFAULT_STRIPE_LAYOUT_A4,
                        ],
                        [
                          "A5",
                          stripeA5,
                          updateStripeA5,
                          DEFAULT_STRIPE_LAYOUT_A5,
                        ],
                      ] as const
                    ).map(([label, value, update, defaults]) => (
                      <div
                        key={label}
                        className="bg-card flex flex-col gap-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{label}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground text-[11px] underline-offset-2 hover:underline"
                            onClick={() => update({ ...defaults })}
                          >
                            الافتراضي
                          </button>
                        </div>
                        <MeasureField
                          label="عرض الشريط"
                          value={value.widthCm}
                          min={0.5}
                          onChange={(widthCm) =>
                            update({ widthCm: widthCm || defaults.widthCm })
                          }
                        />
                        <MeasureField
                          label="حشوة النص"
                          value={value.insetCm}
                          min={0.1}
                          onChange={(insetCm) =>
                            update({ insetCm: insetCm || defaults.insetCm })
                          }
                        />
                        <MeasureField
                          label="المسافة عن الحافة"
                          value={value.edgeGapCm}
                          min={0}
                          onChange={(edgeGapCm) =>
                            update({
                              edgeGapCm: Number.isFinite(edgeGapCm)
                                ? edgeGapCm
                                : defaults.edgeGapCm,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {section === "prompts" && (
              <Section
                title="تعليمات التوليد"
                description="احفظ أكثر من نص بالاسم. اختيار أحدها في خطوة التوليد ينسخه إلى الحقل دون تعديل النسخة المحفوظة."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={addPrompt}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                    إضافة
                  </Button>
                }
              >
                <div className="space-y-3">
                  {prompts.length === 0 && (
                    <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
                      لا تعليمات محفوظة بعد.
                    </p>
                  )}
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="bg-card flex flex-col gap-2 rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          value={prompt.name}
                          onChange={(e) =>
                            updatePrompt(prompt.id, { name: e.target.value })
                          }
                          placeholder="اسم التعليمات"
                          className="h-8"
                        />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removePrompt(prompt.id)}
                          aria-label="حذف"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            className="size-3.5"
                          />
                        </Button>
                      </div>
                      <Textarea
                        dir="ltr"
                        value={prompt.text}
                        onChange={(e) =>
                          updatePrompt(prompt.id, { text: e.target.value })
                        }
                        placeholder="Describe how the AI should generate the image…"
                        className="max-h-40 overflow-y-auto text-xs"
                        rows={4}
                      />
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
          <p className="text-muted-foreground text-[11px]">
            ملف الإعدادات يضم المفاتيح والنماذج والمقاييس والتعليمات.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => importInputRef.current?.click()}
            >
              <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
              استيراد
            </Button>
            <Button size="sm" className="gap-1" onClick={downloadSettings}>
              <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
              تصدير
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void onImportFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
            {description}
          </p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MeasureField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className="flex items-center gap-1.5">
        <Input
          type="number"
          min={min}
          step={0.01}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-7 w-20 text-xs"
        />
        <span className="text-muted-foreground w-5 text-[11px]">سم</span>
      </span>
    </label>
  );
}

export { AppSettingsDialog };
