import { useState } from "react";
import { useModels } from "@/features/workflow/context";
import {
  DEFAULT_STRIPE_LAYOUT_A4,
  DEFAULT_STRIPE_LAYOUT_A5,
} from "@/features/workflow/lib/cover-layout";
import { PROVIDERS } from "@/features/workflow/lib/provider-models";
import {
  Delete02Icon,
  Key01Icon,
  PlusSignIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

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
    stripeA4,
    stripeA5,
    updateStripeA4,
    updateStripeA5,
  } = useModels();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>الإعدادات</DialogTitle>
          <DialogDescription>
            مفاتيح API، عرض الشريط، وتعليمات التوليد المحفوظة.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">مفاتيح واجهة البرمجة</Label>
          <div className="space-y-2">
            {PROVIDERS.map((provider) => (
              <div key={provider.id} className="flex items-center gap-2">
                <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md border">
                  <HugeiconsIcon
                    icon={Key01Icon}
                    className="text-muted-foreground size-4"
                  />
                </div>
                <div className="w-28 shrink-0 text-sm font-medium">
                  {provider.label}
                </div>
                <div className="relative flex-1">
                  <Input
                    type={revealed[provider.id] ? "text" : "password"}
                    placeholder="مفتاح API"
                    value={keys[provider.id]}
                    onChange={(e) => setKey(provider.id, e.target.value)}
                    className="pr-8"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((prev) => ({
                        ...prev,
                        [provider.id]: !prev[provider.id],
                      }))
                    }
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  >
                    <HugeiconsIcon
                      icon={revealed[provider.id] ? ViewOffIcon : ViewIcon}
                      className="size-4"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">شريط الظهر</Label>
          <p className="text-muted-foreground text-[11px]">
            العرض، حشوة النص، والمسافة عن حافة الغلاف لكل حجم.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["A4", stripeA4, updateStripeA4, DEFAULT_STRIPE_LAYOUT_A4],
                ["A5", stripeA5, updateStripeA5, DEFAULT_STRIPE_LAYOUT_A5],
              ] as const
            ).map(([label, value, update, defaults]) => (
              <div key={label} className="space-y-2 rounded-md border p-2">
                <Label className="text-xs font-medium">{label}</Label>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-[11px]">
                    عرض الشريط (سم)
                  </Label>
                  <Input
                    type="number"
                    min={0.5}
                    step={0.01}
                    value={value.widthCm}
                    onChange={(e) =>
                      update({
                        widthCm: Number(e.target.value) || defaults.widthCm,
                      })
                    }
                    className="h-8"
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-[11px]">
                    حشوة النص (سم)
                  </Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.01}
                    value={value.insetCm}
                    onChange={(e) =>
                      update({
                        insetCm: Number(e.target.value) || defaults.insetCm,
                      })
                    }
                    className="h-8"
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground text-[11px]">
                    المسافة عن الحافة (سم)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={value.edgeGapCm}
                    onChange={(e) =>
                      update({
                        edgeGapCm: Number(e.target.value) || defaults.edgeGapCm,
                      })
                    }
                    className="h-8"
                    dir="ltr"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium">تعليمات التوليد</Label>
            <Button size="sm" variant="outline" className="gap-1" onClick={addPrompt}>
              <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
              إضافة
            </Button>
          </div>
          <p className="text-muted-foreground text-[11px]">
            احفظ أكثر من نص بالاسم. اختيار أحدها في خطوة التوليد ينسخه إلى الحقل
            دون تعديل النسخة المحفوظة.
          </p>
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="flex flex-col gap-2 rounded-md border p-2"
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
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => removePrompt(prompt.id)}
                    aria-label="حذف"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                  </Button>
                </div>
                <Textarea
                  dir="ltr"
                  value={prompt.text}
                  onChange={(e) =>
                    updatePrompt(prompt.id, { text: e.target.value })
                  }
                  placeholder="Describe how the AI should generate the image…"
                  className="max-h-36 overflow-y-auto"
                  rows={3}
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AppSettingsDialog };
